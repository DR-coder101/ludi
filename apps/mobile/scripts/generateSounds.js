// Simple script to generate lightweight audio files using ffmpeg
// These are placeholder sounds - in production, use proper sound design

const { execSync } = require('child_process');
const path = require('path');

const soundsDir = path.join(__dirname, '../assets/sounds');

console.log('Generating simple game sound effects...');

try {
  // Dice roll - short rattling noise (200ms)
  execSync(
    `ffmpeg -f lavfi -i "sine=frequency=800:duration=0.05,sine=frequency=600:duration=0.05,sine=frequency=700:duration=0.05,sine=frequency=650:duration=0.05" -af "volume=0.3" -y "${soundsDir}/roll.mp3"`,
    { stdio: 'inherit' }
  );

  // Hop - quick boop (100ms)
  execSync(
    `ffmpeg -f lavfi -i "sine=frequency=440:duration=0.1" -af "afade=t=out:st=0.05:d=0.05,volume=0.2" -y "${soundsDir}/hop.mp3"`,
    { stdio: 'inherit' }
  );

  // Capture - descending tone (300ms)
  execSync(
    `ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1,sine=frequency=600:duration=0.1,sine=frequency=400:duration=0.1" -af "volume=0.3" -y "${soundsDir}/capture.mp3"`,
    { stdio: 'inherit' }
  );

  // Win - ascending chime (500ms)
  execSync(
    `ffmpeg -f lavfi -i "sine=frequency=523:duration=0.15,sine=frequency=659:duration=0.15,sine=frequency=784:duration=0.2" -af "volume=0.3" -y "${soundsDir}/win.mp3"`,
    { stdio: 'inherit' }
  );

  console.log('✓ Sound effects generated successfully');
} catch (error) {
  console.error('Failed to generate sounds (ffmpeg might not be installed)');
  console.log('Creating silent placeholder files...');
  
  // Create minimal valid MP3 files as placeholders
  const silentMp3 = Buffer.from('//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7////////////////////////////////////////////////////////////AAAAAExhdmM1OC4xMzQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64');
  
  const fs = require('fs');
  fs.writeFileSync(path.join(soundsDir, 'roll.mp3'), silentMp3);
  fs.writeFileSync(path.join(soundsDir, 'hop.mp3'), silentMp3);
  fs.writeFileSync(path.join(soundsDir, 'capture.mp3'), silentMp3);
  fs.writeFileSync(path.join(soundsDir, 'win.mp3'), silentMp3);
  
  console.log('✓ Placeholder sound files created');
}
