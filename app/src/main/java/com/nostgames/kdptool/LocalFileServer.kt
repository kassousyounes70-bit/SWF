package com.nostgames.kdptool

import fi.iki.elonen.NanoHTTPD
import java.io.ByteArrayInputStream

class LocalFileServer(port: Int = 8080) : NanoHTTPD(port) {

    private var fileBytes: ByteArray? = null
    private var mimeType: String = "application/octet-stream"
    private var fileName: String = "downloaded_file"

    fun setFileData(bytes: ByteArray, mime: String, name: String) {
        this.fileBytes = bytes
        this.mimeType = mime
        this.fileName = name
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        if (uri.startsWith("/download") && fileBytes != null) {
            val stream = ByteArrayInputStream(fileBytes)
            val response = newFixedLengthResponse(
                Response.Status.OK,
                mimeType,
                stream,
                fileBytes!!.size.toLong()
            )
            // إضافة الترويسات لإجبار أندرويد على تنزيل الملف باسمه المخصص
            response.addHeader("Content-Disposition", "attachment; filename=\"$fileName\"")
            return response
        }
        return newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found")
    }
}
