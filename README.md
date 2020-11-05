# LaughPass

Use `lpass` the lastpass cli tool with Okta SSO!

# Usage

1. install the package for your platform (see below)

1. `export LPASS_PINENTRY=/opt/laughpass/pinentry`

1. `lpass login --sso <your email address>`

1. Complete the login via Okta

1. Your session will be valid for one hour. Configure with the `LPASS_AGENT_TIMEOUT` environment variable (seconds)

# Installation