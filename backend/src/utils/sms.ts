import axios from 'axios';

export const sendSMS = async (mobileNumber: string, message: string, dltTemplateId: string) => {
  const user = process.env.SMS_USER || 'svjyschool';
  const password = process.env.SMS_PASSWORD || '';
  const senderId = process.env.SMS_SENDER_ID || 'SVJY';
  const peid = process.env.SMS_PEID || '1701175221827066708';
  
  if (!password) {
    console.warn('SMS password not configured. Skipping SMS.');
    return false;
  }

  const apiUrl = `http://bulksms.saakshisoftware.in/api/mt/SendSMS`;
  
  const params = {
    user,
    password,
    senderid: senderId,
    channel: 'trans',
    DCS: 0,
    flashsms: 0,
    number: `91${mobileNumber.replace(/\D/g, '').slice(-10)}`, // Ensure 10 digits
    text: message,
    route: '04',
    DLTTemplateId: dltTemplateId,
    PEID: peid
  };

  try {
    const response = await axios.get(apiUrl, { params });
    console.log(`SMS sent to ${mobileNumber}:`, response.data);
    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, error);
    return false;
  }
};
