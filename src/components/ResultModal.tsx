import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SpinResult, Theme } from '../types';
import { LUNAR_GREETINGS } from '../constants/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ResultModalProps {
  visible: boolean;
  result: SpinResult | null;
  theme: Theme;
  onClose: () => void;
  onSpinAgain: () => void;
  onReset: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  result,
  theme,
  onClose,
  onSpinAgain,
  onReset,
}) => {
  if (!result) return null;

  const greeting = LUNAR_GREETINGS[Math.floor(Math.random() * LUNAR_GREETINGS.length)];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.palette[0], borderColor: theme.accent }]}>
          <Text style={[styles.header, { color: theme.accent }]}>🎊 恭喜獲獎 🎊</Text>

          <View style={[styles.resultBox, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
            {result.option.type === 'text' ? (
              <Text style={[styles.resultText, { color: theme.text }]}>
                {result.option.content}
              </Text>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: result.option.content }}
                  style={[styles.resultImage, { borderColor: theme.accent }]}
                />
                <View style={[styles.fuBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.fuText, { color: theme.bg }]}>福</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.greeting, { color: theme.text }]}>"{greeting}"</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent, borderColor: theme.palette[3] }]}
              onPress={onSpinAgain}
            >
              <Text style={[styles.primaryButtonText, { color: theme.bg === '#FFF5F5' ? '#FFF' : theme.bg }]}>
                龍馬精神 (再轉一次)
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: theme.palette[1] }]}
                onPress={onReset}
              >
                <Text style={styles.secondaryButtonText}>重新製作</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.bg, borderColor: theme.accent }]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.accent }]}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 6,
    zIndex: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 20,
  },
  resultBox: {
    padding: 30,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  resultImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
  },
  fuBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fuText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 2,
  },
  buttons: {},
  primaryButton: {
    padding: 18,
    borderRadius: 12,
    borderBottomWidth: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  secondaryButtons: {
    flexDirection: 'row',
  },
  secondaryButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fef3c7',
  },
  closeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResultModal;
