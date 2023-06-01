# pinentry

`pinentry` is a generic tool/protocol for obtaining secrets from a user. It is commonly used with `gpg` and similar tools.

The protocol is loosely [defined here](http://info2html.sourceforge.net/cgi-bin/info2html-demo/info2html?(pinentry)Protocol)

`lpass` also uses `pinentry` to obtain the master password from the user. This tool provides a shim (implemented in bash) which will invoke `lpass-sso` (electron app) to obtain the relevant password (which is not something that the user would normally know) and return it to `lpass`.

The shim will be invoked by `lpass` two times. Once to obtain the `passowrd` (hidden master password) and once to obtain the `fragment_id`.
As we only want to invoke `lpass-sso` once, we temporarily store the `fragment_id` on disk so that it is available on the subsequent invocation.
The disk cache is deleted on the second invocation.

For a seamless experience, `lpass` must be configured to use the shim
```
export LPASS_PINENTRY=/Applications/lpass-sso.app/Contents/pinentry
```
If you want to use `lpass-sso` then you should set that in your `~/.bashrc` or `~/.zshrc`. This shim is not compatible with the non-sso login method of `lpass`.
