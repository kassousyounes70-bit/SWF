use base64::Engine;
use reqwest::Client;
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{DigitallySignedStruct, Error as RustlsError, SignatureScheme};
use sha2::{Digest, Sha256};
use std::fmt;
use std::sync::{Arc, OnceLock};
use x509_parser::prelude::parse_x509_certificate;

const BASE_URL: &str = "https://yk-pubengine-v1.onrender.com";
const HOST: &str = "yk-pubengine-v1.onrender.com";

// These are the same two SHA-256 SPKI pins used by the Android network-security-config.
const PIN_PRIMARY: &str = "kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=";
const PIN_BACKUP: &str = "mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=";

struct PinnedVerifier {
    inner: Arc<rustls::client::WebPkiServerVerifier>,
    pins: [Vec<u8>; 2],
}

impl fmt::Debug for PinnedVerifier {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("PinnedVerifier").field("pins", &2).finish()
    }
}

impl PinnedVerifier {
    fn new(inner: Arc<rustls::client::WebPkiServerVerifier>) -> Self {
        let decode = |value: &str| {
            base64::engine::general_purpose::STANDARD
                .decode(value)
                .expect("YK PubEngine pin must be valid base64")
        };
        Self { inner, pins: [decode(PIN_PRIMARY), decode(PIN_BACKUP)] }
    }

    fn pin_matches(&self, cert: &CertificateDer<'_>) -> bool {
        let Ok((_, parsed)) = parse_x509_certificate(cert.as_ref()) else {
            return false;
        };
        let spki_der = parsed.tbs_certificate.subject_pki.raw;
        let digest = Sha256::digest(spki_der);
        self.pins.iter().any(|pin| pin.as_slice() == digest.as_slice())
    }
}

impl ServerCertVerifier for PinnedVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        now: UnixTime,
    ) -> Result<ServerCertVerified, RustlsError> {
        // First keep normal WebPKI verification: trusted chain, validity and hostname.
        let verified = self.inner.verify_server_cert(
            end_entity,
            intermediates,
            server_name,
            ocsp_response,
            now,
        )?;

        // Then require the leaf certificate's SubjectPublicKeyInfo to match one
        // of the pinned SHA-256 values from the Android configuration.
        if !self.pin_matches(end_entity) {
            return Err(RustlsError::General(
                "YK PubEngine TLS certificate pin mismatch".to_string(),
            ));
        }

        Ok(verified)
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, RustlsError> {
        self.inner.verify_tls12_signature(message, cert, dss)
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, RustlsError> {
        self.inner.verify_tls13_signature(message, cert, dss)
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.inner.supported_verify_schemes()
    }
}

fn build_client() -> Result<Client, String> {
    let mut roots = rustls::RootCertStore::empty();
    roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    let verifier = rustls::client::WebPkiServerVerifier::builder(Arc::new(roots))
        .build()
        .map_err(|e| format!("TLS verifier initialization failed: {e}"))?;

    let tls_config = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(PinnedVerifier::new(verifier)))
        .with_no_client_auth();

    Client::builder()
        .use_preconfigured_tls(tls_config)
        .https_only(true)
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Secure network client initialization failed: {e}"))
}

fn client() -> Result<&'static Client, String> {
    static CLIENT: OnceLock<Result<Client, String>> = OnceLock::new();
    CLIENT.get_or_init(build_client).as_ref().map_err(Clone::clone)
}

fn allowed_path(path: &str) -> bool {
    matches!(path, "/createAccount" | "/login" | "/resetPassword" | "/getTool")
}

#[tauri::command]
pub async fn secure_api_request(path: String, body: String) -> Result<String, String> {
    if !allowed_path(&path) {
        return Err("Network path is not allowed".to_string());
    }

    let url = format!("{BASE_URL}{path}");
    let parsed: serde_json::Value = serde_json::from_str(&body)
        .map_err(|_| "Invalid request payload".to_string())?;

    let response = client()?
        .post(url)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .header(reqwest::header::ACCEPT, "application/json")
        .json(&parsed)
        .send()
        .await
        .map_err(|e| format!("Secure connection failed: {e}"))?;

    let status = response.status().as_u16();
    let text = response
        .text()
        .await
        .map_err(|e| format!("Server response could not be read: {e}"))?;

    serde_json::to_string(&serde_json::json!({
        "status": status,
        "ok": (200..300).contains(&status),
        "body": text,
        "host": HOST
    }))
    .map_err(|e| format!("Response serialization failed: {e}"))
}
