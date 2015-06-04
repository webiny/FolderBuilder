<?php

/**
 * Class Structure recursively traverses your directory structure and builds JSON suitable for Webiny Folder Builder
 * Use in conjunction with "Webiny Folder Builder" for fancy results ;)
 *
 * USAGE:
 *
 * 1. Read entire folder tree:
 * php structure.php /path/to/your/folder > myStructure.json
 *
 * 2. Limit depth to 2:
 * php structure.php /path/to/your/folder 2 > myStructure.json
 *
 * http://fb.webiny.com/
 * https://github.com/Webiny/FolderBuilder
 */
class Structure
{
    const FOLDER = 'tree-folder';
    const FILE = 'tree-file';

    private static $depth = 0;
    private static $currentDepth = 0;

    private $skip = [
        '.',
        '..',
        '.git',
        '.idea',
        '.gitignore'
    ];

    function buildStructure($rootFolder, $depth)
    {
        self::$depth = $depth;
        $structure = [];

        if (($path = realpath($rootFolder)) !== false) {
            $structure = $this->_recursiveRead($path);
        }

        return $structure;
    }

    private function _recursiveRead($directory)
    {
        if (self::$depth > 0 && self::$currentDepth >= self::$depth) {
            return [];
        }
        self::$currentDepth++;
        $structure = [];
        $handle = opendir($directory);

        while (($item = readdir($handle)) !== false) {
            $path = $directory . '/' . $item;
            if (!in_array($item, $this->skip)) {
                if (is_dir($path)) {
                    $structure[] = [
                        'id'       => $this->GUID(),
                        'text'     => $item,
                        'type'     => self::FOLDER,
                        'children' => $this->_recursiveRead($path)
                    ];
                    if(self::$currentDepth < 0){
                        self::$currentDepth = 0;
                    }
                } else {
                    $structure[] = [
                        'id'   => $this->GUID(),
                        'text' => $item,
                        'type' => self::FILE
                    ];
                }
            }
        }
        self::$currentDepth--;

        usort($structure, function ($a, $b) {
            if ($a['type'] == self::FOLDER && $b['type'] == self::FOLDER) {
                if (strcasecmp($a['text'], $b['text']) < 0) {
                    return -1;
                }

                if (strcasecmp($a['text'], $b['text']) > 0) {
                    return 1;
                }
            }

            if ($a['type'] == self::FILE && $b['type'] == self::FILE) {
                if (strcasecmp($a['text'], $b['text']) < 0) {
                    return -1;
                }

                if (strcasecmp($a['text'], $b['text']) > 0) {
                    return 1;
                }
            }

            if ($a['type'] == self::FOLDER && $b['type'] == self::FILE) {
                return -1;
            }

            if ($a['type'] == self::FILE && $b['type'] == self::FOLDER) {
                return 1;
            }
        }
        );


        closedir($handle);

        return $structure;
    }

    private function GUID()
    {
        if (function_exists('com_create_guid') === true) {
            return trim(com_create_guid(), '{}');
        }

        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535),
                       mt_rand(16384, 20479), mt_rand(32768, 49151), mt_rand(0, 65535), mt_rand(0, 65535),
                       mt_rand(0, 65535)
        );
    }
}

echo "Starting\n";

$rootFolder = isset($argv[1]) ? $argv[1] : getcwd();
$depth = isset($argv[2]) ? $argv[2] : 0;
$structure = new Structure();
$data = $structure->buildStructure($rootFolder, $depth);
die(json_encode($data));
