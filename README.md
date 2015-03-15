# FolderBuilder
Folder builder tool to help developers in the planning stage of their projects


View live demo: http://fb.webiny.com/


Use `structure.php` to generate your structure automatically.

1. Read entire folder tree:
```
php structure.php /path/to/your/folder > myStructure.json
``` 
                                                              
2. Limit depth to 2 subfolders:                                          
```
php structure.php /path/to/your/folder 2 > myStructure.json   
```