# Virus Taxonomy D3
A web visualization project to display the virus taxonomy in hierarchical treeview. 
## Environment

- Editor: [Visual Studio Code](https://code.visualstudio.com/download)
- Technology: JS (D3, jQuery), HTML5, CSS3

## Instructions
- Run using IDE: Open [index.html](index.html) file from VS code or Webstorm's built-in web server
- Run using local web server: 
  - Opening the [index.html](index.html) will cause CORS error in local machine as it requires to load local JSON file. 
  - A simple HTTP server can overcome this:
    - Open a terminal/command prompt in the current folder
    - Start local server: ```python -m http.server```
    - Open [http://localhost:8000/](http://localhost:8000/) in a browser

### Note

- [2022.json](data/2022.json) is the latest updated file.
- This version is currently under development.

### References
- [Current virus taxonomy](https://ictv.global/taxonomy)