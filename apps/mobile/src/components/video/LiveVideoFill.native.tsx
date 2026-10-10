import { StyleSheet } from 'react-native';
import { isTrackReference, useTracks, VideoTrack } from '@livekit/react-native';

export function LiveVideoFill({ identity }: { identity: string }) {
  const tracks = useTracks();
  const track = tracks.find(
    (candidate) =>
      isTrackReference(candidate) &&
      candidate.participant.identity === identity &&
      String(candidate.source) === 'camera',
  );
  if (!track || !isTrackReference(track) || !track.publication?.isEnabled) return null;
  return <VideoTrack trackRef={track} style={styles.fill} objectFit="cover" />;
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
});
