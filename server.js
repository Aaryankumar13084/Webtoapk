
const express = require("express");
const multer = require("multer");
const AdmZip = require("adm-zip");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const zipPath = req.file.path;
    const unzipPath = `uploads/${req.file.filename}_extracted`;

    // Extract ZIP file
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(unzipPath, true);

    // Build APK using Cordova
    exec(`cordova create ${unzipPath}/apkApp && cd ${unzipPath}/apkApp && cordova platform add android && cordova build android`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ message: "Error creating APK", error: stderr });
        }

        // Serve APK to user
        const apkPath = `${unzipPath}/apkApp/platforms/android/app/build/outputs/apk/debug/app-debug.apk`;
        res.json({ success: true, apk_url: `/${apkPath}` });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
