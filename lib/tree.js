function Tree(el) {
    var _this = this;
    this.el = el;

    this.getUniqId = function () {
        var delim = '-';

        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }

        return S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4();
    };

    this.setData = function (data) {
        _this.el.data('tree', null);

        _this.el.tree({
            dnd: true,
            lines: true,
            data: data,
            onSelect: function (node) {
                $('#delete-item').removeClass('disabled');
            },
            onClick: function (node) {
                var editNode = $(this).data('editNode');
                if (editNode) {
                    $(this).tree('cancelEdit', editNode.target);
                }
            },
            onDblClick: function (node, e) {
                if (e.target.classList.contains('tree-hit') || !node) {
                    return;
                }

                $(this).data('editNode', node);
                $(this).tree('beginEdit', node.target);
            },
            onAfterEdit: function (node) {
                $(this).data('editNode', null);
                _this.setData(_this.getData());
            },
            onCancelEdit: function (node) {
                _this.el.data('editNode', null);
            },
            onBeforeItemRender: function (item) {
                if (item.type == 'tree-folder') {
                    return;
                }
                var cssClass = _this._detectExtension(item.text);
                item.iconCls = 'icon-' + cssClass;
            },
            onFolderEmpty: function (item) {
                setTimeout(function () {
                    if (item.children.length) {
                        return;
                    }
                    var modal = $('#folder-empty');
                    modal.data('item', item).find('.empty-folder-name').html(item.text);

                    modal.on("show.bs.modal", function () {
                        var node = modal.data('item');
                        var dom = $(node.target);

                        // Convert to file
                        modal.find("button.btn-primary").on("click", function (e) {
                            dom.find(".tree-icon").removeClass("tree-folder-open tree-folder").addClass("tree-file");
                            _this.el.tree('update', {
                                target: node.target,
                                type: 'tree-file',
                                children: null
                            });
                            modal.modal('hide');
                        });

                        // Leave as folder
                        modal.find("button.btn-default").on("click", function (e) {
                            _this.el.tree('update', {
                                target: node.target,
                                type: 'tree-folder',
                                children: []
                            });
                            modal.modal('hide');
                        });
                    });

                    modal.on("hide.bs.modal", function () {
                        modal.find("button.btn-primary").off("click");
                        modal.find("button.btn-default").off("click");
                    });

                    modal.modal();
                }, 50);
            }
        });
    };

    this.addDirectory = function (name) {
        if (typeof name == "undefined" || $.trim(name) == '') {
            return;
        }

        var folders = name.split(',');
        var lastDir = null;
        for (var i = 0; i < folders.length; i++) {
            lastDir = this._addDirectory(folders[i], _this.getSelectedNode());
        }

        return lastDir;
    };

    this.addFile = function (name) {
        if (typeof name == "undefined" || $.trim(name) == '') {
            return;
        }

        var files = name.split(',');
        var targetNode = _this.getSelectedNode();
        for (var i = 0; i < files.length; i++) {
            _this._addFile(files[i], targetNode)
        }
    };

    this.getSelectedNode = function () {
        return _this.el.tree('getSelected');
    };

    this.deleteNode = function (node) {
        if (!node) {
            return;
        }
        _this.el.tree('remove', node.target);
        $('#delete-item').addClass('disabled');
    };

    this.getData = function () {
        var rootNodes = _this.el.tree('getRoots');

        if (!rootNodes || !rootNodes.length) {
            return [];
        }

        var data = [];

        $.each(rootNodes, function (index, rootNode) {
            var nodeData = $.extend(true, {}, _this.el.tree('getData', rootNode.target));
            data.push(_this._cleanUp(nodeData));
        });

        return data;
    };

    this.generatePathSet = function (data, currentPath) {

        if (data === undefined) {
            data = this.getData();
        }

        if (currentPath === undefined) {
            currentPath = '';
        }

        var paths = [];
        for (var i = 0; i < data.length; i++) {
            var newPath = currentPath + data[i].text;
            var folder = this.nodeIsFolder(data[i]);
            if (folder) {
                newPath += '/';
            }
            if (this.nodeIsLast(data[i])) {
                var path = {
                    folder: folder,
                    path: newPath
                };
                paths.push(path);
            } else {
                var subPaths = this.generatePathSet(data[i].children, newPath);
                for (var j = 0; j < subPaths.length; j++) {
                    paths.push(subPaths[j]);
                }
            }
        }
        return paths;
    };

    this.generateCommandsList = function() {

        var paths = this.generatePathSet();

        var files = [];
        var folders = [];

        // Separate files and folders
        for (var i = 0; i < paths.length; i++) {
            if (paths[i].folder) {
                folders.push(paths[i].path);
            } else {
                files.push(paths[i].path);
            }
        }

        files.forEach(function(element, index, array) {
            var fragments = element.split('/');
            fragments.pop();
            if (fragments.length > 0) {
                folders.push(fragments.join('/') + "/");
            }
        });

        var commands = '';

        folders.forEach(function(element, index, array) {
            commands += "mkdir -p "+ element +"\n";
        });
        files.forEach(function(element, index, array) {
            commands += "touch "+ element +"\n";
        });

        return commands;
    };

    this.nodeIsLast = function (node) {
        return node.children === undefined || node.children.length == 0;
    };

    this.nodeIsFolder = function (node) {
        return node.type == 'tree-folder';
    };

    this.expandAll = function () {
        _this.el.tree('expandAll');
    };

    this.collapseAll = function () {
        _this.el.tree('collapseAll');
    };

    this._addNode = function (data, target) {
        var selected = target || _this.el.tree('getSelected');
        _this.el.tree('append', {
            parent: selected ? selected.target : null,
            data: data
        });
        return _this._getNodeByName(selected, data.text);
    };

    this._addDirectory = function (name, targetNode) {
        var names = explode('/', name, 2);

        // Root folder name
        var rootName = names.shift();

        // Check if root folder already exists
        var rootNode = this._getNodeByName(targetNode, rootName);

        if (!rootNode) {
            rootNode = _this._addNode({
                id: _this.getUniqId(),
                text: rootName,
                iconCls: '',
                type: 'tree-folder',
                children: []
            }, targetNode);
        }

        if (names && names.length > 0) {
            return _this._addDirectory(names[0], rootNode)
        }
        return rootNode;
    };

    this._addFile = function (name, targetNode) {
        var fileName = name;

        if (name.indexOf('/') > -1) {
            var dirs = name.split('/');
            fileName = dirs.pop();
            targetNode = _this.addDirectory(dirs.join('/'));
        }

        if (!_this._getNodeByName(targetNode, fileName)) {
            _this._addNode({
                id: _this.getUniqId(),
                text: fileName,
                type: 'tree-file'
            }, targetNode);
        }
    };

    this._getNodeByName = function (target, name) {
        var nodes = [];
        if (!target) {
            nodes = _this.el.tree('getRoots');
        } else {
            nodes = _this.el.tree('getChildren', target.target || null);
        }

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].text == name) {
                return nodes[i];
            }
        }
        return false;
    };

    /**
     * Remove keys from data that are not needed in the JSON
     *
     * @param data
     * @returns {*}
     * @private
     */
    this._cleanUp = function (data) {
        if (data.children) {
            for (var i = 0; i < data.children.length; i++) {
                _this._cleanUp(data.children[i]);
            }
        }

        delete data['target'];
        delete data['domId'];
        delete data['checked'];
        delete data['iconCls'];

        return data;
    };

    var fileNameMap = {
        '.htaccess': 'binary',
        '.gitignore': 'binary',
        '.gitattributes': 'binary'
    };

    var extMap = {
        'png': 'image',
        'jpg': 'image',
        'gif': 'image',
        ////////////////////
        'html': 'code',
        'css': 'code',
        'less': 'code',
        'scss': 'code',
        'js': 'code',
        'json': 'code',
        'yaml': 'code',
        'xml': 'code',
        ////////////////////
        'zip': 'zipper',
        'rar': 'zipper',
        '7zip': 'zipper',
        'tar.gz': 'zipper',
        'tar.bz2': 'zipper',
        'tar': 'zipper',
        ////////////////////
        'php': 'php',
        'pdf': 'pdf',
        'mp3': 'music',
        'wav': 'music',
        'cs': 'visual-studio',
        'cpp': 'visual-studio',
        'h': 'visual-studio',
        ////////////////////
        'doc': 'office',
        'docx': 'office',
        'ppt': 'office',
        'pptx': 'office',
        'xls': 'office',
        'xlsx': 'office',
        'csv': 'office',
        'txt': 'text',
        'log': 'binary'
    };

    this._detectExtension = function (fileName) {
        if (fileNameMap.hasOwnProperty(fileName)) {
            return fileNameMap[fileName];
        }

        var ext = fileName.split('.').pop();

        if (extMap.hasOwnProperty(ext)) {
            return extMap[ext];
        }

        return 'code';
    };
}

function explode(delimiter, string, limit) {
    //  discuss at: http://phpjs.org/functions/explode/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //   example 1: explode(' ', 'Kevin van Zonneveld');
    //   returns 1: {0: 'Kevin', 1: 'van', 2: 'Zonneveld'}

    if (arguments.length < 2 || typeof delimiter === 'undefined' || typeof string === 'undefined') return null;
    if (delimiter === '' || delimiter === false || delimiter === null) return false;
    if (typeof delimiter === 'function' || typeof delimiter === 'object' || typeof string === 'function' || typeof string ===
        'object') {
        return {
            0: ''
        };
    }
    if (delimiter === true) delimiter = '1';

    // Here we go...
    delimiter += '';
    string += '';

    var s = string.split(delimiter);

    if (typeof limit === 'undefined') return s;

    // Support for limit
    if (limit === 0) limit = 1;

    // Positive limit
    if (limit > 0) {
        if (limit >= s.length) return s;
        return s.slice(0, limit - 1)
            .concat([s.slice(limit - 1)
                .join(delimiter)
            ]);
    }

    // Negative limit
    if (-limit >= s.length) return [];

    s.splice(s.length + limit);
    return s;
}