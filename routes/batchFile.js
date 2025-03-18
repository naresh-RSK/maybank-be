const express = require("express");
const batchFileRouter = express.Router();
const { spawn } = require('child_process');

// batchFileRouter.post('/appCode', async (req, res) => {
//     const { APPCODE } = req.body
//     try {
//         //const curlCommand = `curl -X GET http://10.4.93.96:9002/processFiles?applCode=${APPCODE}&startingFrom=HEADER`;
//         // const curlCommand = `curl -X GET  https://jsonplaceholder.typicode.com/todos/1`;

//         // // Execute the curl command
//         // exec(curlCommand, (error, stdout, stderr) => {
//         //     if (error) {
//         //         console.error(`exec error: ${error}`);
//         //         return res.status(500).send(`Error: ${error.message}`);
//         //     }
//         //     if (stderr) {
//         //         console.error(`stderr: ${stderr}`);
//         //         return res.status(500).send(`stderr: ${stderr}`);
//         //     }
    
//         //     // Send the result of the curl command back to the client
//         //     console.log(`stdout: ${stdout}`);
//         //     res.send({ result: stdout });
//         // });

//         const curlCommand = `curl -X GET  https://jsonplaceholder.typicode.com/todos/1`;

//         // Execute the curl command
//         exec(curlCommand, (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`exec error: ${error}`);
//                 return res.status(500).send(`Error: ${error.message}`);
//             }
//             if (stderr) {
//                 console.error(`stderr: ${stderr}`);
//                 return res.status(500).send(`stderr: ${stderr}`);
//             }
    
//             // Send the result of the curl command back to the client
//             console.log(`stdout: ${stdout}`);
//             res.send({ result: stdout });
//         });
//     } catch (err) {
//         res.status(500).send(err.message);
//     }
// });
batchFileRouter.post('/appCode', async (req, res) => {
    const { APPCODE } = req.body
    
    try {
        const curlCommand = ['-X', 'GET', 'http://localhost:8080/api/baseSystem/get'];
 
const curlProcess = spawn('curl', curlCommand);
 
 
let outputData = '';
 
curlProcess.stdout.on('data', (data) => {
    outputData += data.toString();
});
 
curlProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});
 
curlProcess.on('error', (error) => {
    console.error(`Curl execution error: ${error.message}`);
    res.status(500).send(`Error: ${error.message}`);
});
 
curlProcess.on('close', (code) => {
    if (code === 0) {
        console.log(`stdout: ${outputData}`);
        res.send({ result: outputData.trim() });
    } else {
        res.status(500).send(`Curl process exited with code ${code}`);
    }
});

    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = batchFileRouter;