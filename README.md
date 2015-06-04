# FolderBuilder
Folder builder tool to help developers in the planning stage of their projects

View live demo: http://fb.webiny.com/

## Using

You can use it directly via `structure.php`:

1. Read entire folder tree:
```
php structure.php /path/to/your/folder > myStructure.json
``` 
                                                              
2. Limit depth to 2 subfolders:                                          
```
php structure.php /path/to/your/folder 2 > myStructure.json   
```

or install globally with Composer and use from anywhere:

```
composer global require webiny/folderbuilder
```

then use it on any folder:

```
wfb ~/Code > output.json
```

or limit depth:

```
wfb ~/Code 2 > output.json
```

## Contributing

Feel free to send PRs.

## License

MIT

## Todo

- generate folders and files from pre-existing JSON structure, not just the other way around
- a test or two?
