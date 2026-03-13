import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";

async function uploadProject() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  // 读取打包文件
  const fileContent = readFileSync("/workspace/ves-interactive-project.tar.gz");
  
  // 上传文件
  const key = await storage.uploadFile({
    fileContent,
    fileName: "ves-interactive-project.tar.gz",
    contentType: "application/gzip",
  });

  // 生成下载链接（有效期 7 天）
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7 天
  });

  console.log("下载链接：");
  console.log(downloadUrl);
}

uploadProject().catch(console.error);
