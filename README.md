# LaughPass

Use `lpass` the lastpass cli tool with Okta SSO!

# Usage

1. install the package for your platform (see below)

1. `export LPASS_PINENTRY=/opt/laughpass/pinentry`

1. `lpass login --sso <your email address>`

1. Complete the login via Okta

1. Your session will be valid for one hour. Configure with the `LPASS_AGENT_TIMEOUT` environment variable (seconds)

# Installation

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
