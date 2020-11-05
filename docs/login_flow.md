# LastPass SSO Login Flow

1. DISCOvery - Find SSO provider details for the email address

* `curl 'https://lastpass.com/lmiapi/login/type?username=john.newbigin%40example.com'`

```json
{
  "type": 3,
  "IdentityProviderGUID": "",
  "IdentityProviderURL": "https://accounts.lastpass.com",
  "OpenIDConnectAuthority": "https://example.okta.com/oauth2/aus1gevwwk8Eq2No91d9/.well-known/openid-configuration",
  "OpenIDConnectClientId": "0oa1gevztvwuqzvun1d9",
  "CompanyId": 12928771,
  "OpenIDConnectKeys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "PQxT4v24kZRF44Y0OUqF_Tu4aam5BC1t0C730KdptGA",
      "x5t": null,
      "n": "osu4S4X5JSXaktP7FamnyHtOqJua795PUxAO3D2WRxUytofHQYLcwK14rEjmDgyOVF31wNKq4hythXiWhz6Li6IqLY6zd2LsDhf3Ry22ffDUPGTYXb1a-frR92hedgjG5CQnsbjP0aXgwxCCr1-FYWBii5btc2ePXYR554H2OePZzKj3az3ZpgRDfp0IDkGIBEiSsoYdyXzIPjOTtlFYutvdxBJ_kFqw1zNMknjrxWe3jcwt9O6oUUlUC3FHgCVFrQVhi0O76JPe-7KZYphADJxbZVdSOXcNrtgvxcDBwwPtFq07CYo9bdrqBVlV5qMTh6EeWOW0g7rd7WEbOwqG0Q",
      "e": "AQAB",
      "x5c": [],
      "issuer": null
    },
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "eZdIit4i9EKqTa6Q6h6lpXV-n85C5U8G-wyz74CN7i4",
      "x5t": null,
      "n": "pkssSOBiuESJoJtY-Cmn_U3jTLfLaYhIn66dSsk0kRwpCT8LQkDAtiYmxXs6b0mSlbeYCIDNtbl7M0IxLkU2rOE8dgwAGboGGI9uwGYt3cwV7-Qhl-KQqM6xxob3wJnriVBeN50j_9pE9D_bpFGuFgTZLM4Srwbo63IJKEwQBv1GCuipfwBqRG5j8G4fTaUVyixFH78ruR_S9yVVKKcr8ofXj5fHnr56yEeAwIV3AZvJTrx0TQLDWdTnWYOP1G5G-z6hKdsJTA7ICnN_2b63Q0mNfZ9xBfEX9S1ecIx0layfNJnJZjR5vkIrq6yfQauc3WYZDe4N3GQK4izP1sJXyw",
      "e": "AQAB",
      "x5c": [],
      "issuer": null
    }
  ],
  "Provider": 1,
  "OldEmail": ""
}

Notes:
* We will need the `company_id` later
* type `3` is Okta. That is the only flow supported by this tool

1. Initiate the login flow

    let redirect_uri = 'https://accounts.lastpass.com/federated/oidcredirect.html'
    let client_id = OpenIDConnectClientId
    let response_type = 'id_token token'
    let scope = 'openid email profile'
    let state = random_uuid
    let nonce = random_uuid
    let login_hint = email (NB: we strip the @ to make a username which is what Okta needs)
    let login_url = .oidc.authorization_endpoint +
        '?client_id=' + client_id +
        '&redirect_uri=' + redirect_uri +
        '&response_type=' + response_type +
        '&scope=' + scope +
        '&state=' + state +
        '&nonce=' + nonce +
        '&login_hint=' + login_hint

Using a webview, redirect to `$login_url`

1. Capture the redirect to `https://accounts.lastpass.com/federated/oidcredirect.html`

1. Extract the fragment, id_token, access_token
The access_token is a jwt which contains the k1 (user key)

1. Use the id_token and company_id to get k2 (org key)
https://accounts.lastpass.com/federatedlogin/api/v1/getkey

https://rea.okta.com/oauth2/aus1gevwwk8Eq2No91d8/v1/authorize?client_id=0oa1gevztvwuqzvun1d8&redirect_uri=https%3A%2F%2Faccounts.lastpass.com%2Ffederated%2Foidcredirect.html&response_type=id_token%20token&scope=openid%20email%20profile&state=a22f891a2bf249e1bdb62d4717dc6716&nonce=38a415a673aa43b5a1849a2d24d4784c&login_hint=john.newbigin%40rea-group.com

{"company_id":12928771,"id_token":"eyJraWQiOiJlWmRJaXQ0aTlFS3FUYTZRNmg2bHBYVi1uODVDNVU4Ry13eXo3NENON2k0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIwMHUxNmg3dzJ1OGR5aXVkYjFkOCIsIm5hbWUiOiJKb2huIE5ld2JpZ2luIiwiZW1haWwiOiJqb2huLm5ld2JpZ2luQHJlYS1ncm91cC5jb20iLCJ2ZXIiOjEsImlzcyI6Imh0dHBzOi8vcmVhLm9rdGEuY29tL29hdXRoMi9hdXMxZ2V2d3drOEVxMk5vOTFkOCIsImF1ZCI6IjBvYTFnZXZ6dHZ3dXF6dnVuMWQ4IiwiaWF0IjoxNjAzMzQwMzM0LCJleHAiOjE2MDMzNDM5MzQsImp0aSI6IklELnhkUEN2NzNQNUlad0ZUWUthSWFYQl9rWkk2X3dBUnE5T1lOMGZQSVY5bDAiLCJhbXIiOlsicHdkIiwic3drIiwibWZhIl0sImlkcCI6IjBvYTQ2ODZjZGJFTlZTTUZWTk9UIiwibm9uY2UiOiI5NGMxY2RiYmUyZTY0ZGVjYTViOGIyMzI3MmI1NDQ4NCIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG4ubmV3YmlnaW5Ad2luLmludC5yZWFsZXN0YXRlLmNvbS5hdSIsImF1dGhfdGltZSI6MTYwMzM0MDMxOSwiYXRfaGFzaCI6IkdOMUxzSkNza19sSUktSHRvSnpralEifQ.at-hQYvOMeFgBwKlgFiyf4RpHyTywWsj2eiyfyHJZi5D4H2kaz7VR-vhOyjabg4JqEFnTx7394UNliIZBZqIJ4wmDfXT3gjWVmBSoQuIf8iDIuv7MlbgbzRu19wPWjBhie6T5y7lMrnuXZBQ1OgALQF9kecBtBvSFXcKrU0W0coR30jw5iluo8gZ-T6zNjx5OZRthey6DkWJW7ObIFVUWhICQWNMQpEOXGWgV1CvF0WRwYG9Mtc33I0Vxag7xchlUzTSA6VmIesrCXGFT3DRJFHYYT9XqVwNaUX3VFVn1r8Zh5KABxCmzEW1mJcc8j46cB-Vtp1GlGRXB4wD4taa8g"}

 https://accounts.lastpass.com/federated/oidcredirect.html#
 id_token=eyJraWQiOiJlWmRJaXQ0aTlFS3FUYTZRNmg2bHBYVi1uODVDNVU4Ry13eXo3NENON2k0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIwMHUxNmg3dzJ1OGR5aXVkYjFkOCIsIm5hbWUiOiJKb2huIE5ld2JpZ2luIiwiZW1haWwiOiJqb2huLm5ld2JpZ2luQHJlYS1ncm91cC5jb20iLCJ2ZXIiOjEsImlzcyI6Imh0dHBzOi8vcmVhLm9rdGEuY29tL29hdXRoMi9hdXMxZ2V2d3drOEVxMk5vOTFkOCIsImF1ZCI6IjBvYTFnZXZ6dHZ3dXF6dnVuMWQ4IiwiaWF0IjoxNjAzNjgwNjQ4LCJleHAiOjE2MDM2ODQyNDgsImp0aSI6IklELjh4cmFuWmU5RVpEVFRDZkdqeDJnWjNVNWZQZTA5cnBOT2R1SmZ0N2lYM2siLCJhbXIiOlsic3drIiwibWZhIiwicHdkIl0sImlkcCI6IjBvYTQ2ODZjZGJFTlZTTUZWTk9UIiwibm9uY2UiOiI3M2UxYzk0OGZlNGE0ZjAyOTdkM2QyYWUxMjg3ODRmNiIsInByZWZlcnJlZF91c2VybmFtZSI6ImpvaG4ubmV3YmlnaW5Ad2luLmludC5yZWFsZXN0YXRlLmNvbS5hdSIsImF1dGhfdGltZSI6MTYwMzY4MDYzNiwiYXRfaGFzaCI6ImtkRldaR3NneU56Q0Vqc2Q3WWt0N1EifQ.ASK-86ky6ebKoWchuq4fnTJwxI5wjIHJ1POJK3uMZXophEgxr3hDJBE9tFAMVKoeORAYeba0YGJy75GRRTzY5Z282IB8Oj2Yro4RTH1bu0k8W7XFrSMXuTxTvxm_UGdvAilLbrLp8F9cygerGyq-LSJwjg34TJaTitYigvpE_aJ0_1IhIFuuUiqkyoQObAz_E_5jdSZwxMyOz_BqCHycdmZ5uXG_slSz90NkaSiwiHYs2IQkCmsbHvkuTur7bhyhydlUAI4bowrxNK-sQWyBuYLj9JVpDMNux9BMeIBsdmx64Fz_Q49e6bh8kIIk8-SWAVu34qTy0uKQECAbTNLRzQ&
 access_token=eyJraWQiOiJlWmRJaXQ0aTlFS3FUYTZRNmg2bHBYVi1uODVDNVU4Ry13eXo3NENON2k0IiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULkZJX1ZSMnlhVmpMWU5KZG5LY1NkNXZwaUt5cWR2TlRKV3BDRUt1QVVSS28iLCJpc3MiOiJodHRwczovL3JlYS5va3RhLmNvbS9vYXV0aDIvYXVzMWdldnd3azhFcTJObzkxZDgiLCJhdWQiOiJhbGwiLCJpYXQiOjE2MDM2ODA2NDgsImV4cCI6MTYwMzY4NDI0OCwiY2lkIjoiMG9hMWdldnp0dnd1cXp2dW4xZDgiLCJ1aWQiOiIwMHUxNmg3dzJ1OGR5aXVkYjFkOCIsInNjcCI6WyJwcm9maWxlIiwib3BlbmlkIiwiZW1haWwiXSwic3ViIjoiam9obi5uZXdiaWdpbkB3aW4uaW50LnJlYWxlc3RhdGUuY29tLmF1IiwiTGFzdFBhc3NLMSI6ImtSUkdudnowQEBKQHZOQ1BURnRoNEZESTV0U1VaKiFkQSJ9.ipxLjNcGPKJXAdA9iLdCAS05UVn1FrRYjFhIqWwEMwPk1NXpucG8BthXefuJU-O8ztY3ZxMX0b9OglTRfn3iUPtn5uVwhG_ahthNEjQUF01lUQ4FIaGWmG6nfTumWNMhqH6bMYsl-x04BqxQ1E-GToCmYJIz4NPrgS7E2TtuYdnjmhgXAWIaCA45aqNtcXyk_miimC1S6Iq7cvtlgTmevtgAL0_XRY3reRrcr22SeFU44qMqf3YM4mY0E3T-EsOE4Eaw9c4OPec3dD7KezubpkNJK0DjqwJY4LPWGDhevlIzJG8utM5yJI2ubrUsFnM-w5rr5qdJLPh7TrVSpOAgaQ&
 token_type=Bearer&
 expires_in=3600&
 scope=profile+openid+email&
 state=efa7c951611c4113b36b284bdd002a89
