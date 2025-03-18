const express = require("express");
const bodyParser = require("body-parser"); // To parse form data
const passwordSecurityRouter = express.Router();

// Middleware to parse form data
passwordSecurityRouter.use(bodyParser.urlencoded({ extended: true }));

// Function to encode password to Base64
function encodeToBase64(password) {
    return Buffer.from(password).toString('base64');
}

// Route to display the form
passwordSecurityRouter.get('/enterPwd', async (req, res) => {
    try {
        res.send(`<html>
        <head>
          <title>Password Encryption</title>
          <style>
            /* Style for the eye icon */
            .eye-icon {
              position: absolute;
              right: 10px;
              top: 34px;
              cursor: pointer;
            }

            .password-container {
              position: relative;
              width: 250px;
            }

            #password {
              width: 100%;
              padding: 8px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <h1>Enter Password to Encrypt (Base64)</h1>
          <form action="/api/passwordSecurity/encryptPwd" method="POST">
            <div class="password-container">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
              <span class="eye-icon" onclick="togglePasswordVisibility()">👁️</span>
            </div>
            <button type="submit">Encrypt</button>
          </form>

          <script>
            function togglePasswordVisibility() {
              const passwordField = document.getElementById('password');
              const eyeIcon = document.querySelector('.eye-icon');

              // Toggle between 'password' and 'text' input type
              if (passwordField.type === 'password') {
                passwordField.type = 'text';
                eyeIcon.textContent = '🙈'; // Change the eye icon to indicate hidden password
              } else {
                passwordField.type = 'password';
                eyeIcon.textContent = '👁️'; // Change back to show eye icon
              }
            }
          </script>
        </body>
      </html>
    `);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

passwordSecurityRouter.get('/decryptPwd', async (req, res) => {
  try {
      res.send(`<html>
      <head>
        <title>Password Encryption</title>
        <style>
          /* Style for the eye icon */
          .eye-icon {
            position: absolute;
            right: 10px;
            top: 34px;
            cursor: pointer;
          }

          .password-container {
            position: relative;
            width: 250px;
          }

          #password {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>Enter Password to Decrypt (Base64)</h1>
        <form action="/api/passwordSecurity/pwdDecrypt" method="POST">
          <div class="password-container">
            <label for="password">Password:</label>
            <input type="string" id="password" name="password" required>
          </div>
          <button type="submit">Encrypt</button>
        </form>

        
      </body>
    </html>
  `);
  } catch (err) {
      res.status(500).send(err.message);
  }
});

// Route to handle the form submission and encrypt the password
passwordSecurityRouter.post('/encryptPwd', async (req, res) => {
    try {
        const password = req.body.password; // Get the password from the form
        console.log(password, "password");
        
        const encodedPassword = encodeToBase64(password); // Base64 encode the password
        console.log(encodedPassword, "encodedPassword");

        // Send the encoded password back in the response
        res.send(`
            <html>
              <head><title>Password Encryption</title></head>
              <body>
                <h1>Encrypted Password (Base64)</h1>
                <p>${encodedPassword}</p>
                <a href="/api/passwordSecurity/enterPwd">Go Back</a>
              </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

passwordSecurityRouter.post('/pwdDecrypt', async (req, res) => {
  try {
      const password = req.body.password; // Get the password from the form
      let decodedBuffer = Buffer.from(password, "base64");
  let decodedPassword = decodedBuffer?.toString("utf-8");

      // Send the encoded password back in the response
      res.send(`
          <html>
            <head><title>Password Decryption</title></head>
            <body>
              <h1>Decrypted Password (Base64)</h1>
              <p>${decodedPassword}</p>
              <a href="/api/passwordSecurity/decryptPwd">Go Back</a>
            </body>
          </html>
      `);
  } catch (err) {
      res.status(500).send(err.message);
  }
});

module.exports = passwordSecurityRouter;
