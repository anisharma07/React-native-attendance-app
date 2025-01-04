import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  ToastAndroid,
  Switch,
} from 'react-native';
import useStore from '../store/store';
import {Days, CardInterface, Slots} from '../types/cards';
import {Picker} from '@react-native-picker/picker';
import {
  convertTo24Hrs,
  convertToStartSeconds,
  convertToUTM,
} from '../utils/functions';
import Calendar from '../components/Calendar';
import TagColorPicker from '../components/TagColorPicker';

const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
type DayOfWeek = (typeof daysOfWeek)[number];

const daysOfWeekMap: Record<DayOfWeek, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

interface currDayTimeProps {
  day: keyof Days;
  startTime: string;
  isAM_start: boolean;
  endTime: string;
  isAM_end: boolean;
}

const AddCard: React.FC = ({navigation, route}: any) => {
  const {addCard, activeRegister, registers, defaultTargetPercentage} =
    useStore();
  const [currDayTime, setCurrDayTime] = useState<currDayTimeProps>({
    day: 'mon',
    startTime: '10:00',
    isAM_start: true,
    endTime: '12:00',
    isAM_end: false,
  });
  const [includeAbsents, setIncludeAbsents] = useState(false);
  const [frequency, setFrequency] = useState('0');
  const registerName = registers[activeRegister].name;

  const [card, setCard] = useState<CardInterface>({
    id: 1,
    title: '',
    present: 0,
    total: 0,
    target_percentage: defaultTargetPercentage,
    tagColor: '#FFFFFF',
    days: {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    },
    markedAt: [],
    hasLimit: false,
    limit: 0,
    limitType: 'with-absent',
  });
  const setSelectedColor = (color: string) => {
    setCard(prev => ({
      ...prev,
      tagColor: color,
    }));
  };

  const handleInputChange = (
    field: keyof CardInterface,
    value: string | number,
  ) => {
    setCard(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeChange = (field: string, value: string | number) => {
    setCurrDayTime(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleLimitToggle = (value: boolean) => {
    setCard(prev => ({
      ...prev,
      hasLimit: value,
    }));
  };
  const handleFreqUpdate = (value: string) => {
    setCard(prev => ({
      ...prev,
      limit: parseInt(value),
    }));
  };
  const handleLimitType = (value: boolean) => {
    setCard(prev => ({
      ...prev,
      limitType: value == true ? 'with-absent' : 'without-absent',
    }));
  };
  const handleDayChange = (day: keyof Days) => {
    setCurrDayTime(prev => ({
      ...prev,
      day,
    }));
  };
  const handleIdChange = (value: number) => {
    setCard(prev => ({
      ...prev,
      id: value,
    }));
  };

  useEffect(() => {
    handleIdChange(registers[activeRegister]?.cards?.length);
  }, [registers, activeRegister]);

  const toggleStartAM = () => {
    setCurrDayTime(prev => ({
      ...prev,
      isAM_start: !prev.isAM_start,
    }));
  };
  const toggleEndAM = () => {
    setCurrDayTime(prev => ({
      ...prev,
      isAM_end: !prev.isAM_end,
    }));
  };

  const isValidTime = (time: string) => {
    // check format HH:MM and not alphabets
    if (!/^\d{2}:\d{2}$/.test(time)) return false;

    // check if hours and minutes are in valid range
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 1 || hours > 12) return false;
    if (minutes < 0 || minutes > 59) return false;
    return true;
  };

  const handleAddTime = () => {
    if (currDayTime.startTime === '00:00' && currDayTime.endTime === '00:00') {
      Alert.alert('Error', 'Please fill Correct Time!');
      return;
    }
    if (card.days[currDayTime.day].length >= 3) {
      Alert.alert('Error', 'Maximum 3 Slots Allowed on a single Day!');
      return;
    }
    const isNew = card.days[currDayTime.day].findIndex(
      dayTime =>
        dayTime.start ===
          convertTo24Hrs(currDayTime.startTime, currDayTime.isAM_start) &&
        dayTime.end ===
          convertTo24Hrs(currDayTime.endTime, currDayTime.isAM_end),
    );
    if (isNew !== -1) {
      Alert.alert('Error', 'Slot already exists!');
      return;
    }
    if (
      !isValidTime(currDayTime.startTime) ||
      !isValidTime(currDayTime.endTime)
    ) {
      Alert.alert('Error', 'Please Fill Correct Time in HH:MM Format!');
      return;
    }

    // is overlapping time
    const newStartTime = convertToStartSeconds(
      convertTo24Hrs(currDayTime.startTime, currDayTime.isAM_start),
    );
    const newEndTime = convertToStartSeconds(
      convertTo24Hrs(currDayTime.endTime, currDayTime.isAM_end),
    );
    console.log(newStartTime, newEndTime);
    const isOverlapping = card.days[currDayTime.day].some(
      dayTime =>
        (newStartTime >= convertToStartSeconds(dayTime.start) &&
          newStartTime <= convertToStartSeconds(dayTime.end)) ||
        (newEndTime >= convertToStartSeconds(dayTime.start) &&
          newEndTime <= convertToStartSeconds(dayTime.end)),
    );
    if (isOverlapping) {
      Alert.alert('Error', 'Time Slot Overlaps with existing slot!');
      return;
    }

    setCard(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [currDayTime.day]: [
          ...prev.days[currDayTime.day],
          {
            start: convertTo24Hrs(
              currDayTime.startTime,
              currDayTime.isAM_start,
            ),
            end: convertTo24Hrs(currDayTime.endTime, currDayTime.isAM_end),
          },
        ],
      },
    }));
    if (Platform.OS === 'android') {
      ToastAndroid.show('New Slot Added', ToastAndroid.SHORT);
    }
  };

  const handleRemoveTime = (day: string, dayTime: Slots) => {
    setCard(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: prev.days[day as keyof Days].filter(
          time => time.start !== dayTime.start && time.end !== dayTime.end,
        ),
      },
    }));
  };

  const handleClearCard = () => {
    const newCard = {
      id: 1,
      title: '',
      present: 0,
      total: 0,
      target_percentage: defaultTargetPercentage,
      tagColor: '',
      days: {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: [],
        sun: [],
      },
      markedAt: [],
      hasLimit: false,
      limit: 0,
      limitType: 'with-absent',
    };
    setCard(newCard);
  };
  const handleSubmit = () => {
    if (!card.title) {
      Alert.alert('Error', 'Please fill all required fields!');
      return;
    }
    if (card.total < card.present) {
      Alert.alert('Error', 'total should be >= present');
      return;
    }
    if (card.target_percentage > 100 || card.target_percentage < 0) {
      Alert.alert('Error', 'Target Percentage should be between 0 and 100');
      return;
    }
    addCard(activeRegister, card);
    navigation.navigate('Tab');
    // Add logic to save or navigate
  };
  const handleNavigateBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.topContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNavigateBack}>
          <Image
            source={require('../assets/images/back-btn.png')}
            style={{width: 40, height: 40}}
          />
        </TouchableOpacity>
        <Text style={{color: '#fff', fontSize: 24}}>
          {registerName.length > 15
            ? registerName.substring(0, 15) + '..'
            : registerName}
        </Text>
        <View style={styles.functionButtons}>
          <TouchableOpacity onPress={handleClearCard}>
            <Image
              source={require('../assets/images/clear.png')}
              style={{width: 50, height: 50, objectFit: 'contain'}}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
            <Image
              source={require('../assets/images/save.png')}
              style={{width: 50, height: 50, objectFit: 'contain'}}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <Text style={styles.addCourseTxt}>Add New Course</Text>
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#999"
          value={card.title}
          onChangeText={value => handleInputChange('title', value)}
        />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
          <View style={{width: '48%', minWidth: 75}}>
            <Text style={styles.label}>Present</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter present count"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={card.present.toString()}
              onChangeText={value =>
                handleInputChange('present', parseInt(value) || 0)
              }
            />
          </View>

          <View style={{width: '48%', minWidth: 75}}>
            <Text style={styles.label}>Total</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total count"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={card.total.toString()}
              onChangeText={value =>
                handleInputChange('total', parseInt(value) || 0)
              }
            />
          </View>
        </View>

        <Text style={styles.label}>Target Percentage</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter target percentage"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={card.target_percentage.toString()}
          onChangeText={value =>
            handleInputChange('target_percentage', parseInt(value) || 0)
          }
        />

        <Text style={styles.label}>Add Slots</Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: 10,
          }}>
          <View style={styles.pickerView}>
            <Picker
              selectedValue={currDayTime.day}
              onValueChange={(day: keyof Days) => handleDayChange(day)}
              style={styles.picker}>
              {daysOfWeek.map(day => (
                <Picker.Item key={day} label={daysOfWeekMap[day]} value={day} />
              ))}
            </Picker>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
            <TextInput
              style={styles.input}
              value={currDayTime.startTime}
              onChangeText={value => handleTimeChange('startTime', value)}
            />
            <TouchableOpacity onPress={toggleStartAM}>
              <Text style={styles.ampm}>
                {currDayTime.isAM_start ? 'AM' : 'PM'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>to</Text>
            <TextInput
              style={styles.input}
              value={currDayTime.endTime}
              onChangeText={value => handleTimeChange('endTime', value)}
            />
            <TouchableOpacity onPress={toggleEndAM}>
              <Text style={styles.ampm}>
                {currDayTime.isAM_end ? 'AM' : 'PM'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.addTimeBtn}
            onPress={() => handleAddTime()}>
            <Text style={{color: '#fff', textAlign: 'center'}}>Add</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          contentContainerStyle={styles.tabContainer}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}>
          {Object.keys(card.days).map(day =>
            card.days[day as keyof Days].map((dayTime: Slots) => (
              <View style={styles.tabViewStyle}>
                <TouchableOpacity key={dayTime.start} style={styles.tabButton}>
                  <Text style={styles.tabLabel}>
                    {daysOfWeekMap[day].substring(0, 3)},{' '}
                    {convertToUTM(dayTime.start)}
                    {' - '}
                    {convertToUTM(dayTime.end)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeTimeBtn}
                  onPress={() => handleRemoveTime(day, dayTime)}>
                  <Image
                    source={require('../assets/icons/remove-time-btn.png')}
                    style={styles.remove_time_btn}
                  />
                </TouchableOpacity>
              </View>
            )),
          )}
        </ScrollView>

        <Text style={styles.label}>Tag Color</Text>
        <TagColorPicker
          selectedColor={card.tagColor}
          setSelectedColor={setSelectedColor}
        />
        <View style={styles.container3}>
          {/* Activity Frequency */}
          <View style={styles.row}>
            <Text style={styles.label3}>Activity Frequency</Text>
            <Switch
              value={card.hasLimit}
              onValueChange={value => handleLimitToggle(value)}
            />
          </View>
          {/* hasLimit: false,
    limit: 0,
    limitType: 'with-absent', */}
          {/* Frequency Input */}
          <View style={styles.row}>
            <Text style={styles.label}>Frequency</Text>
            <TextInput
              style={styles.input3}
              keyboardType="numeric"
              value={card.limit.toString()}
              onChangeText={text => handleFreqUpdate(text)}
            />
          </View>

          {/* Include Absents */}
          <View style={styles.row}>
            <Text style={styles.label3}>Include Absents</Text>
            <Switch
              value={card.limitType === 'with-absent' ? true : false}
              onValueChange={value => handleLimitType(value)}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderRadius: 15,
    width: '100%',
    margin: 'auto',
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  functionButtons: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  addCourseTxt: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'left',
    marginBottom: 20,
  },
  todayIcon: {
    width: 35,
    height: 35,
  },

  topContainer: {
    flex: 1,
    backgroundColor: '#18181B',
    padding: 16,
  },
  scrollView: {
    flex: 0,
    flexGrow: 0,
  },
  scrollView2: {
    flex: 1,
  },
  tabContainer: {
    paddingVertical: 10,
  },
  tabViewStyle: {
    position: 'relative',
  },
  removeTimeBtn: {
    position: 'absolute',
    right: 3,
    top: -7,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#008817',
  },
  remove_time_btn: {
    width: 18,
    height: 18,
  },
  container: {
    flex: 1,
    backgroundColor: '#18181B',
    paddingHorizontal: 5,
  },
  // sideLabel: {
  //   fontSize: 16,
  //   color: '#fff',
  //   marginBottom: 8,
  //   marginTop: 16,
  // },
  tabLabel: {
    fontSize: 11,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  addTimeBtn: {
    backgroundColor: '#CE0000',
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  subLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    marginTop: 8,
  },
  ampm: {
    backgroundColor: '#1F1F22',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#464646',
  },
  input: {
    backgroundColor: '#1F1F22',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#464646',
  },
  pickerView: {
    borderWidth: 1,
    borderColor: '#464646',
    width: '100%',
    minWidth: 160,
    marginBottom: 8,
    borderRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: '#1F1F22',
  },
  picker: {
    color: '#fff',
  },
  container3: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E1E1E', // Dark background
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  label3: {
    fontSize: 16,
    color: '#FFFFFF', // White text
  },
  input3: {
    width: 60,
    height: 40,
    backgroundColor: '#333',
    color: '#FFF',
    textAlign: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
});

export default AddCard;
