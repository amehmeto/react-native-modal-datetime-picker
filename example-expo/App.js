import React, { useState } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

export default function App() {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => setIsVisible(true)}>
        <Text style={styles.buttonText}>Open Time Picker</Text>
      </Pressable>
      <DateTimePickerModal
        isVisible={isVisible}
        mode="time"
        is24Hour={true}
        borderRadiusIOS={12}
        onConfirm={(date) => {
          console.log('Confirmed:', date)
          setIsVisible(false)
        }}
        onCancel={() => setIsVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#0C207A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
})
