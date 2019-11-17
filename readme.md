#MAGENT
### A local MITM HTTP(s) request message proxy server
This software implement a local
Man In The Middle (MITM) proxy to capturing the request message and forward to remote host, It looks like an HTTP(s) proxy but only the HTTP(s) message can pass throuth it.

#Installation
* git:
	* clone this repo
	* ```npm i -g```
* npm:
	* ```npm i magent -g```
#Run
* generate the root certifcate: ```magent gen```
* import certifcate ```ca.crt``` to your system or browser
* Client:
	* set the local proxy: ```magent proxy init```
	* start the local proxy: ```magent proxy```
* Server:
	* set the sever: ```magent server init```
	* start the sever on remote host: ```magent server```

#Notice
* Only the HTTP(s) message can pass throuth the proxy

#License
(The MIT License)

Copyright (c) 2019 DNetL &lt;DNetL@pm.me&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.