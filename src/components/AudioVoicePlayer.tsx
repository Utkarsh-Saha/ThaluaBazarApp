import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { COLORS } from '../constants/theme';
import { triggerHaptic } from '../lib/haptics';

interface AudioVoicePlayerProps {
  audioUri: string;
  durationSeconds?: number;
  isSender?: boolean;
}

const BAR_COUNT = 16;
const STATIC_HEIGHTS = [8, 14, 22, 12, 18, 24, 16, 20, 26, 14, 18, 10, 22, 16, 12, 6];

export const AudioVoicePlayer: React.FC<AudioVoicePlayerProps> = ({
  audioUri,
  durationSeconds = 0,
  isSender = false,
}) => {
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;
  const currentTime = Math.floor(status.currentTime || 0);
  const totalDuration = Math.max(durationSeconds, Math.floor(status.duration || 0));

  const handleTogglePlay = () => {
    triggerHaptic('light');
    if (isPlaying) {
      player.pause();
    } else {
      if (status.currentTime >= status.duration && status.duration > 0) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const displayTime = isPlaying
    ? `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`
    : `${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`;

  const buttonBg = isSender ? '#FFFFFF' : COLORS.primary;
  const buttonIconColor = isSender ? COLORS.primary : '#FFFFFF';
  const barActiveColor = isSender ? '#FFFFFF' : COLORS.primary;
  const barInactiveColor = isSender ? 'rgba(255, 255, 255, 0.45)' : COLORS.border;
  const timeColor = isSender ? '#FFFFFF' : COLORS.textMuted;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, { backgroundColor: buttonBg }]}
        onPress={handleTogglePlay}
        activeOpacity={0.8}
      >
        {isPlaying ? (
          <Pause size={14} color={buttonIconColor} />
        ) : (
          <Play size={14} color={buttonIconColor} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {STATIC_HEIGHTS.map((baseHeight, index) => {
          const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
          const isBarPlayed = index / BAR_COUNT <= progress;

          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: baseHeight,
                  backgroundColor: isBarPlayed || isPlaying ? barActiveColor : barInactiveColor,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[styles.durationText, { color: timeColor }]}>{displayTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 190,
    paddingVertical: 2,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
