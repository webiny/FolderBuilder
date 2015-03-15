/**
 * Bootstrap script
 *
 * This script initializes Tree object and binds event handlers for keyboard shortcuts
 * and action buttons clicks.
 */
$(function () {
	$('button[data-toggle="tooltip"]').tooltip();

	var wTree = new Tree($('#tree'));

	shortcut.add("Ctrl+D", function () {
		$('#add-directory').click();
	});

	shortcut.add("Ctrl+F", function () {
		$('#add-file').click();
	});

	shortcut.add("Ctrl+S", function () {
		$('#save-structure').click();
	});

	shortcut.add("Ctrl+L", function () {
		$('#load-structure').click();
	});

	$('#add-directory').click(function () {
		var modal = $('#add-directory-modal');

		modal.on("show.bs.modal", function () {
			var primaryButton = modal.find("button.btn-primary");
			modal.find('form').submit(function(e){
				e.preventDefault();
				primaryButton.click();
			});
			setTimeout(function(){
				modal.find('input').focus();
			}, 10);
			primaryButton.on("click", function (e) {
				wTree.addDirectory(modal.find('input').val());
				wTree.setData(wTree.getData());
				modal.find('input').val('');
			});
		});

		modal.on("hide.bs.modal", function () {
			modal.find("button.btn-primary").off("click");
		});

		modal.modal();
	});

	$('#add-file').click(function () {
		var modal = $('#add-file-modal');

		modal.on("show.bs.modal", function () {
			var primaryButton = modal.find("button.btn-primary");
			modal.find('form').submit(function(e){
				e.preventDefault();
				primaryButton.click();
			});
			setTimeout(function(){
				modal.find('input').focus();
			}, 10);
			primaryButton.on("click", function (e) {
				wTree.addFile(modal.find('input').val());
				wTree.setData(wTree.getData());
				modal.find('input').val('');
			});
		});

		modal.on("hide.bs.modal", function () {
			modal.find("button.btn-primary").off("click");
		});
		modal.modal();
	});

	$('#save-structure').click(function () {
		var items = JSON.stringify(wTree.getData());
		$('#save-json').val(items).show().select();
	});

	$('#load-structure').click(function () {
		$('#save-json').val('');
		$('#load-json').show().select();
	});

	$('#load-json').blur(function () {
		try {
			var data = $.parseJSON($(this).val());
			wTree.setData(data);
		} catch (e) {
			// Do nothing
		}
		$(this).val('').hide();
	});

	$('#save-json').blur(function () {
		$(this).hide();
	});

	$('#delete-item').click(function () {
		if(wTree.getSelectedNode()){
			$('#delete-confirmation').modal();
		}
	});

	$('#delete-item-confirm').click(function () {
		wTree.deleteNode(wTree.getSelectedNode());
	});

	$(document).keyup(function (e) {
		if (e.keyCode == 46) {
			$('#delete-item').click();
		}
	});

	$('#expand-all').click(function () {
		wTree.expandAll();
	});

	$('#collapse-all').click(function () {
		wTree.collapseAll();
	});

	wTree.setData([{
		"id": wTree.getUniqId(),
		"text": "ProjectRoot",
		"iconCls": "",
		"type": "tree-folder",
		"state": "open",
		"children": [{
			"id": wTree.getUniqId(),
			"text": "Uploads",
			"iconCls": "",
			"type": "tree-folder",
			"state": "open"
		}, {
			"id": wTree.getUniqId(),
			"text": "App",
			"iconCls": "",
			"type": "tree-folder",
			"state": "open",
			"children": [{
				"id": wTree.getUniqId(),
				"text": "index.php",
				"iconCls": "",
				"type": "tree-file",
				"state": "open"
			}]
		}, {"id": wTree.getUniqId(), "text": "Api", "iconCls": "", "type": "tree-folder", "state": "open"}]
	}, {
		"id": wTree.getUniqId(),
		"text": "Public",
		"iconCls": "",
		"type": "tree-folder",
		"state": "open"
	}, {"id": wTree.getUniqId(), "text": ".htaccess", "iconCls": "", "type": "tree-file", "state": "open"}]);

});
