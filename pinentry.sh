#!/bin/bash
#set -e -u -o pipefail

# A bash script which implements the GPG pin entry protocol
# and can invoke laughpass as required to get the password out of the SSO

#SETTITLE LastPass CLI
#SETPROMPT Master Password:
#SETDESC Please enter the LastPass master password for <asdf>.
#OPTION ttytype=xterm-256color
#OPTION ttyname=/dev/pts/14
#OPTION display=:0
#GETPIN
#BYE

LAUGHPASS=/home/john.newbigin/working/laughpass/electron-quick-start/electron-quick-start-linux-x64/electron-quick-start
MODE=unknown

while true ; do
  echo "OK"
  read -r LINE
  COMMAND="${LINE%% *}"
  PARAMS="${LINE#* }"
  if [ "$COMMAND" = "SETPROMPT" ] ; then
    if [ "$PARAMS" = "Master Password:" ] ; then
      # We must run the tool but we don't know the username yet
      MODE=password
    elif [ "$PARAMS" = "SSO Fragment:" ] ; then
      # return the cached fragment string
      MODE=fragment
    fi
  fi

  if [ "$COMMAND" = "SETDESC" ] ; then
    EMAIL="${LINE%%>*}"
    EMAIL="${EMAIL##*<}"
  fi

  if [ "$COMMAND" = "GETPIN" ] ; then
    if [ "$MODE" = "password" ] ; then
      OUTPUT=$($LAUGHPASS --email="$EMAIL")
      PASSWORD=$(echo "$OUTPUT" | grep '^PASSWORD:' | cut -d : -f 2)
      FRAGMENT=$(echo "$OUTPUT" | grep '^FRAGMENT:' | cut -d : -f 2)
      echo "D $PASSWORD"
      echo "$FRAGMENT" > ~/.lastpass/fragment # this is not ideal but we need a way to store a value between invocations
    elif [ "$MODE" = "fragment" ] ; then
      FRAGMENT=$(cat ~/.lastpass/fragment)
      rm -f ~/.lastpass/fragment
      echo "D $FRAGMENT"
    else
      exit 1
    fi

  fi

  if [ "$COMMAND" = "BYE" ] ; then
    break
  fi

done
echo "OK"
exit 0
