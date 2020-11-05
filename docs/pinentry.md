# pinentry

`pinentry` is a generic tool/protocol for obtaining secrets from a user.

The protocol is loosely [defined here](http://info2html.sourceforge.net/cgi-bin/info2html-demo/info2html?(pinentry)Protocol)

We provide a shim implemented in bash which will invoke laughpass to obtain the password and return it to lpass.

The shim will be invoked two times. Once to obtain the passowrd (hidden master password) and once to obtain the fragment_id.
As we only want to invoke laughpass once, we store the fragment_id on disk so that it is available on the subsequent invocation.
The disk cache is deleted on the second invocation.

For a seamless experience, `lpass` must be configured to use the shim
```
export LPASS_PINENTRY=/opt/laughpass/pinentry
```