import axios from 'axios';
import { prisma } from './prisma';

export const sendSMS = async (mobileNumber: string, message: string, dltTemplateId: string) => {
  let user = process.env.SMS_USER || 'svjyschool';
  let password = process.env.SMS_PASSWORD || '9676028881';
  let senderId = process.env.SMS_SENDER_ID || 'SVJY';
  let peid = process.env.SMS_PEID || '1701175221827066708';

  user = user || 'svjyschool';
  password = password || '9676028881';
  senderId = senderId || 'SVJY';
  peid = peid || '1701175221827066708';

  if (!password) {
    console.warn(`SMS_PASSWORD is not configured in .env or Settings for ${mobileNumber}.`);
    return false;
  }

  const cleanNumber = mobileNumber ? mobileNumber.replace(/\D/g, '').slice(-10) : '';
  if (!cleanNumber || cleanNumber.length < 10) {
    console.warn(`Invalid mobile number: ${mobileNumber}`);
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
    number: `91${cleanNumber}`,
    text: message,
    route: '04',
    DLTTemplateId: dltTemplateId,
    PEID: peid
  };

  try {
    const response = await axios.get(apiUrl, { params });
    console.log(`SMS sent to ${mobileNumber}:`, response.data);
    
    const respStr = String(response.data).toLowerCase();
    if (respStr.includes('error') || respStr.includes('fail') || respStr.includes('invalid') || respStr.includes('wrong') || respStr.includes('missing')) {
      console.error(`SMS gateway returned error for ${mobileNumber}:`, response.data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${mobileNumber}:`, error);
    return false;
  }
};
