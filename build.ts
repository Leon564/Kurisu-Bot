import fs from 'fs';

function copyFile(source: string, destination: string, title?: string) {
  fs.copyFile(source, destination, (error) => {
    if (error) {
      console.error('Error copying the file:', error);
    } else {
      console.log('File copied successfully.', title || '');
    }
  });
}

// copy baileys-version.json
const Baileys_version_source = 'node_modules/@whiskeysockets/baileys/src/Defaults/baileys-version.json';
const Baileys_version_destination = 'node_modules/@whiskeysockets/baileys/lib/Defaults/baileys-version.json';

copyFile(Baileys_version_source, Baileys_version_destination, 'Baileys version');