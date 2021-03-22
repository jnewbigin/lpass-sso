# lpass sso

Use `lpass` the lastpass cli tool with Okta SSO!

# Usage

1. install the package for your platform (see below)

1. `export LPASS_PINENTRY=/opt/lpass-sso/pinentry`

1. `lpass login --sso <your email address>`

1. Complete the login via Okta in the web browser

1. Your session will be valid for one hour.
   
   Configure with the `LPASS_AGENT_TIMEOUT` environment variable (seconds)

# Installation

These installation steps have been tested on macOS Catalina (10.15).

> NOTE: I am in no way associated with LastPass. These instructions got me up and running with the new SSO modifications, but these docs may need some updates to adhere to LastPass’ best practices and workflow.  

## Installing the LPass-SSO Electron app
Navigate to the `lpass-sso/lpass-sso/` directory.

```
npm install
npm start
```

Test the installation by entering your email address and you should be redirected to the Okta login. 

> NOTE: If you receive a “400 Bad Request” error, try closing the window and restarting the login process. It should work the second time.  

## Installing the updated CLI tool with SSO capabilities
### Install dependencies with Homebrew
```
brew update
brew install cmake pkgconfig
```

### Build the CLI tool from source
```
sudo make
sudo make install
```

> NOTE: due to SIP on macOS, you may have trouble writing to the default path `make install` tries to install lpass to. To get around this I used the directory `/usr/local/` instead. Use this command if you get an error about permissions: `cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr/local` .   

If everything worked correctly, you should now be able to use the command `lpass login --sso email_address@whatever.com` to authenticate to the CLI. 

If you run into any issues, the GitHub Issues page has a lot of good info on previous/current problems, but you can also contact LastPass support by opening a ticket: [How do I contact customer support for LastPass? - LastPass Support](https://support.logmeininc.com/lastpass/help/how-do-i-contact-customer-support-for-lastpass-lp010121)

# How does it work

1. Discovery. Take a username (email address) and check to see if it is a federated LastPass account.
1. OIDC. Retrieve the OIDC properties and prepare the link
1. Login. User clicks the link to initiate the OIDC flow
1.

##


# Main Thread State

* email. This may be provided on the command line
* stage
* company_id

Outputs:
1. FrangmentId
1. MasterPassword

## Development

In this mode, the code will be validated but readable from any stack traces etc.

1. start the development server to serve up the web content on port 3000
```bash
npm run-script start
```
1. start electron using main.js and port 3000
```bash
npm run-script start-electron
```

## Production build

In this mode, the code will be minified and not suitable for debugging
```bash
auto/lint
auto/dev-environment npm run-script build
npx electron .
```

## Deployment package

In this mode, an install package will be created for various platofrms

```bash
auto/build
```
