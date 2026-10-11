---
created: 2026-03-13
modified: 2026-03-13
---

## Accepting arbitrary signatures

![[Pasted_image_20250905104601.png]]

Navigate to the JSON web Token tab. Currently we age get 401 response for the request we need to change the `sub` field to `administrator`.

![[Pasted_image_20250905104804.png]]

![[Pasted_image_20250905104846.png]]

And now just hit send and we will be authorized since the signaure is not verified.

## Accepting tokens with no signature

Original decode JWT
![[Pasted_image_20250905105847.png]]

SInce we need a token with no signuture, we need to set the `alg` field to `none` and also remove the `kid` field. also set the `sub` field to `administrator` . Also get rid of the signature. 

![[Pasted_image_20250905110209.png]]

with that we get authorized.

## JWT header parameter injections

### Injecting self-signed JWTs via the jwk parameter

For this you need to have the `JWT Editor` extension installed. 

After installin it navigate to the JWT editor tab and generate a new RSA key 

![[Pasted_image_20250905111707.png]]

you will be present with an empty form. Press the generate button to generate the key

![[Pasted_image_20250905111810.png]]

The press ok to save it. And now we have our key.
![[Pasted_image_20250905111912.png]]

Now  forward your request to repeater Then switch to  **JSON Web Token** tab and modify the token's payload however you like.

In this case change the sub to administrator

![[Pasted_image_20250905112228.png]]

Then press Attack button at the bottom left corner then then select **Embedded JWK**. When prompted, select your newly generated RSA key

![[Pasted_image_20250905112444.png]]

Send the request to see how the server responds .. In this case I get authorized.

### Injecting self-signed JWTs via the jku parameter

in this lab we are provided with the server that will hold our JWKS but in a real worl senario you will need a server that is accessible by the target.

We follow the previous steps to generate an RSA key.
![[Pasted_image_20250905114603.png]]

Navigate to the exploit server and add this to the body.. the content of the keys should be the key we generated above.

```json
{
	"keys" : [
		{  
    "p": "-SZcMJDUZKI-iNnG8InAjWWtiaiESQ0tNNDVOwM21Vk37DKQWbKb9srA7E81ki2Y4grqljkcQIarHkNLNSBLmVdRXGQXZclQLmSmrUFj8dTiYyhBqYJJmaiy579J6SYc_B2qks-FluqK4QQU7AntdcGU-oFGFskzs4pH4gWv0HE",  
    "kty": "RSA",  
    "q": "3G8hYhVJVYdUTVFPlVG_8fIffKOJROH4z61PvOzeP7baOVYnqVhDajFQbR8N3o8nJAcevSyXqYcbVSNToMyPPqNmeii8fR7_F_ioAHNhANnDlRokMq8z0LBJPH3qR7Bj5QBWassPc_oIIV4VE3srDJqd_8wD0ivorqL2zUSdMkE",  
    "d": "AywA60YUYfMMjfsrH9mVOGJWEKGx_1ifXVO2XDgnt9WgZvnPH9fkeTDDll0SPNtKDjHPCSi4mjGw0zXikD0bCdp070Tb9qNgaayvHpimly6uQVxu4HPTUUzFdD-yGT7u_QrdKR943pIcNdKpMdswjsI-WZOdcqbTJLT-YIDqYLGE3OZGI96nXLqeLT0sxafEg9fr4pjTjOwAq6-Xiv4rfUQvt7UAKLHcGT6hwfs27LCOyQkx9y2_y03sF3Z6k9vvtT7XHxcMLjuOkUpEHgXKs9KRWDLbNxU7xUitO0qB2MINv96Otg3VVA3-IGjUJkO4IOqmBiXgdypU7qsdQ8txgQ",  
    "e": "AQAB",  
    "kid": "e65d83f1-9998-4cb0-b7ba-943e1a982b75",  
    "qi": "6lZIgbuQAdvEhzC9IjxyJvouy-R0gKZge75Aykbst7K-KLlA9o38Sjcc_Xkl664_LVwfrLie-1CnUBCW2-2SZ0RFmhD1IWJ38shqHUmXHzQZZXctUCLnTx1LA7giEn3XN9Logd_U6DDAR4dGpufz2LVIEXVrdlCUXS0VovkCaOo",  
    "dp": "SGBKW5lW-bzf6aVJ00pQ80JcPScE9qurPDKGHtR6M1PtmOG_aS8ne3O-w2bnKwWv6co-B1Gj0WLNhscJq-8rxunEqtAws9LdRfzbJm1eeTvcX-2r1XARrV-CSSwabm4x8VM0390E86hCm8cxxLfFkXWgr3yqPahJKpi69P-t6SE",  
    "dq": "2Zyz_ho5jT_OD44n3KcZsIZwYyEm0GOst4jG4SGNvqSLBnNxMBK8asdIOJGhpYb5Au4sgGDXUDra1s_LLUEEYLf64Ln6aiMBfe6yG8_LgYV5OWbXOVoQ8wI1Koy7jg4qb9ZHeaIBHWNGR3qTn-nF8-ln9TC4zPEgAddLghUsgoE",  
    "n": "1okfWRzOZJOZ-3UaILSk5ZsVbMEqS06ZutJU5pBNrCQgQnValZB7DTe-KNbHQTW1bMgxfDWdJPHLEU4-L592sUy_3qf7umJ-loKdeNKHmenx2q_0bteBZITfTKWdJrmY451JUsj9NEX_30sG3N0dGoK-BfUQavxHseuzYYMzGMJ-9Z5ura3xe0iX2FTura89cW8B4GcdE2QhGSr2ZaRfq_lZ-52tbUU9aT5oRFM-3bRb9ep1abNVrMhORbDjmU4Nmu-X6n-n2C3YOqzPDLw-qMZx0Xufeh7kSsUrdospDxqwxSMgfGA8vgUG6kKKVpg7uOLJuSI4wePs3xYtoab-sQ"  
}
	]
}
```

we should have something like this ..  then press store
![[Pasted_image_20250905121010.png]]

- Add a new `jku` parameter to the header of the JWT. Set its value to the URL of your JWK Set on the exploit server.
- Change the `kid` value to that of your key that you coppied to the exploit server
- In the payload, change the value of the `sub` claim to `administrator`.
- At the bottom of the tab, click **Sign**, then select the RSA key that you generated in the previous section.
    
4. Make sure that the **Don't modify header** option is selected, then click **OK**. The modified token is now signed with the correct signature.
5. Send the request. Observe that you have successfully accessed the admin panel.

![[Pasted_image_20250905120729.png]]

With that we get authorized.

## Algorithm confusion attacks
### JWT authentication bypass via algorithm confusion

First we need to obtain the public key 
https://0a0800e70373467c806b5dcb00cf002b.web-security-academy.net/jwks.json

![[Pasted_image_20250905141815.png]]

we need to extract the JWK.. in case we have several keys in the JWKS we need to identify the key responsible for verifying our JWT by decoding our JWT and inspecking the `kid`

JWK

```json
{  
    "kty": "RSA",  
    "e": "AQAB",  
    "use": "sig",  
    "kid": "62ea1104-66f6-4f62-b492-f321978fa617",  
    "alg": "RS256",  
    "n": "rODrhIzOOvZB6w0P-VSTT7IBbJQ68OvwvXCtk9HISCPB07Uy64LJl2iGGL1L45AiSMyhJ3F2cPxvubL6trsh94jHgFRvfdnhbTBPnNw4227eGpIAKs2PlS6sHbanT5rwsvB_VygGJLRW7o6jjZXsc57lTugMvheUJOYjCC2uqUSuv2z-2k_D_-rxLzGwoi1Ugvw9GgXf02g1sKb7PVqWltpJAeIQEhf8wqyYDbiIaUN3u8UWB3bRYVbxdRhnyP16OFqKn_kiV1gfQMit5SarLDw7CK7FRq01iDXXdtRqc3wgTWt6JyUsT300PORV72OC5Ncd2XQbC9RiUIeI4GYVww"  
}
```

Then we need to convert the key to the required format in this case PEM.
Navigate to JWT editor  and click New RSA Key then paste the JWK

![[Pasted_image_20250905142217.png]]

Press okay then right click on the key and press `Copy Public key as PEM`

Then navigate to the decoder tab and encode the key as base64

![[Pasted_image_20250905142506.png]]

copy the base64 encoded string and navigate back to JWT editor tab.
Click  new symmetric key then press generate. replace the value of `k` claim with the base64 encoded string we copied earlier 

![[Pasted_image_20250905142812.png]]

Forward your request with JWT to repeater, navigate to JSON web token tab and modify the token as you want. Change the `alg` to `HS256` and also the `sub` claim to `administrator` 
![[Pasted_image_20250905143328.png]]

click the sign button at the button and select the symmetric key we generated ealier. Also make sure Don't modify header is selected 
![[Pasted_image_20250905143203.png]]

press ok and send you request to see how the server responds.

### JWT authentication bypass via algorithm confusion with no exposed key

first we need to obtain two different JWTs. You can just login to get the first jwt then logout and login again to get the second jwt.

![[Pasted_image_20250905145718.png]]

we get several keys in different format. incase we didnt know the supported format we would send request using the jwt to the server and see which one is accepted but in this case we already know that the server is using the x.509 format. So we just need the x509 base64 encoded key and repeat the process of generating the symmetric key and signing our modified JWT.




