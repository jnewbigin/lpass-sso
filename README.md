# LaughPass

Use `lpass` the lastpass cli tool with Okta SSO!

# Usage

1. install the package for your platform (see below)

1. `export LPASS_PINENTRY=/opt/laughpass/pinentry`

1. `lpass login --sso <your email address>`

1. Complete the login via Okta

1. Your session will be valid for one hour. Configure with the `LPASS_AGENT_TIMEOUT` environment variable (seconds)

# Installation

These installation steps have been tested on macOS Catalina (10.15).

> NOTE: I am in no way associated with LastPass. These instructions got me up and running with the new SSO modifications, but these docs may need some updates to adhere to LastPass’ best practices and workflow.  

## Installing the LaughPass Electron app
Navigate to the `laughpass/laughpass/` directory.

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

