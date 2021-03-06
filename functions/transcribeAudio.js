const fs = require('fs');
const path = require('path');
const storageUtils = require('../utils/storage-utils');
const speechUtils = require('../utils/speech-utils');
module.exports = (event) => {
    console.log(`event.data ${JSON.stringify(event)}`);
    let audioFileNameWithoutExtension;
    return Promise.resolve()
        .then(() => {
            console.log(`event.data.name: ${JSON.stringify(event.name)}`);
            const audioFile = storageUtils.flacBucket.file(event.name);
            const audioFilePath = storageUtils.getFilePathFromFile(audioFile);
            console.log(`audioFilePath: ${JSON.stringify(audioFilePath)}`);
            audioFileNameWithoutExtension = path.parse(audioFilePath).name;
            const request = {
                "config": {
                    "enableWordTimeOffsets": true,
                    "languageCode": "en-US",
                    "encoding": "FLAC",
                    "audioChannelCount": 1
                },
                "audio": {
                    "uri": audioFilePath
                }
            };
            return speechUtils.makeSpeechRequest(request);
        }).then((transcription) => {
            const transcriptionData = JSON.stringify(transcription);
            const transcriptionFilePath = `/tmp/${audioFileNameWithoutExtension}.json`;
            console.log('result: ', transcriptionData);
            //write transcriptions to local file
            return new Promise((resolve, reject) => {
                fs.writeFile(transcriptionFilePath, transcriptionData, function (err) {
                    if (err) {
                        console.log(`Error in writing json`);
                        reject(err);
                    } else {
                        console.log(`Write successful to ${transcriptionFilePath}`);
                        resolve(transcriptionFilePath);
                    }
                });
            });
        }).then((tempFile) => {
            //upload local transcription file to Cloud Storage
            console.log(`Uploading ${tempFile} to json output bucket`);
            return storageUtils.uploadJsonOutput(tempFile);
        }).catch((err) => {
            return Promise.reject(err);
        });
};