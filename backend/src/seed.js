import mongoose from "mongoose";
import { EJSON } from "bson";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Counselor from "./models/counselor.model.js";
import Announcement from "./models/announcement.model.js";
import Appointment from "./models/appointment.model.js";
import AuditTrail from "./models/auditTrail.model.js";
import AvailabilitySlot from "./models/availabilitySlot.model.js";
import CallLog from "./models/callLog.model.js";
import JournalEntry from "./models/journalEntry.model.js";
import Message from "./models/message.model.js";
import Notice from "./models/notice.model.js";
import Resource from "./models/resource.model.js";
import SelfCareModule from "./models/selfCareModule.model.js";
import Suggestion from "./models/suggestion.model.js";

dotenv.config();

const DATA = {
  "users": [
    {
      "_id": {
        "$numberInt": "42609"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4210043",
      "password": "$2b$10$vj9nkcC.l4fTMh3LZ1GZAOGWCsbAsPCoMHkigEuodvTMCJGmmKx3C",
      "fullName": "Joshua Klein A. Malonda",
      "email": "joshuaklein.malonda@ust-legazpi.edu.ph",
      "phone": "09936634496",
      "profilePic": "",
      "userType": "Student",
      "department": "CEAFA",
      "program": "BS Computer Science",
      "createdAt": {
        "$date": {
          "$numberLong": "1781926987634"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787917131458"
        }
      },
      "emergencyContact": {
        "name": "Christian Clark Malonda",
        "relationship": "",
        "contact": "09275646542",
        "address": ""
      },
      "father": {
        "name": "Oscar Malonda Jr.",
        "occupation": "",
        "contact": "09482772002"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Ailynn Malonda",
        "occupation": "",
        "contact": "09465820327"
      },
      "yearLevel": {
        "$numberInt": "1"
      },
      "pin": "0511",
      "dynamicId": "VWWXXYYZ",
      "twoFactorEnabled": false
    },
    {
      "_id": {
        "$numberInt": "70928"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4230306",
      "password": "$2b$10$swS3x2nomVqyxS7adDU8r.ij718Dk6A3nQistBjmQJYVbE/aHpPyq",
      "fullName": "Ardy Geoff Jalina",
      "email": "ardyjeoff.jalina@ust-legazpi.edu.ph",
      "phone": "09123456789",
      "profilePic": "",
      "userType": "Student",
      "department": "CEAFA",
      "program": "BS Computer Science",
      "createdAt": {
        "$date": {
          "$numberLong": "1781928876986"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787917289861"
        }
      },
      "emergencyContact": {
        "name": "Melchrist Alvarez",
        "relationship": "",
        "contact": "09123456789",
        "address": ""
      },
      "father": {
        "name": "Hanz Gregor Jalina",
        "occupation": "",
        "contact": "09123456789"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Vina Grace Jalina",
        "occupation": "",
        "contact": "09123456789"
      },
      "dynamicId": "MYZW6REH",
      "pin": "",
      "twoFactorEnabled": false,
      "yearLevel": {
        "$numberInt": "1"
      }
    },
    {
      "_id": {
        "$numberInt": "23980"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4230023",
      "password": "$2b$10$n30hTHkMOVvUjCsplLNe.ebTZvFefr.eHQZRk7SgZVSgaQOFF8BR6",
      "fullName": "Mark Marbella",
      "email": "mark.marbella@ust-legazpi.edu.ph",
      "phone": "09123456789",
      "profilePic": "",
      "userType": "Student",
      "department": "CEAFA",
      "program": "BS Computer Science",
      "createdAt": {
        "$date": {
          "$numberLong": "1781928986294"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1781928986294"
        }
      },
      "emergencyContact": {
        "name": "Jared Mariscotes",
        "relationship": "",
        "contact": "09123456789",
        "address": ""
      },
      "father": {
        "name": "Daniel Jake Ase",
        "occupation": "",
        "contact": "09123456789"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Caroline Ase",
        "occupation": "",
        "contact": "09123456789"
      }
    },
    {
      "_id": {
        "$numberInt": "20993"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4210021",
      "password": "$2b$10$UlhiaQs0fij4ZihO1pQKhuiqdpwb3eBMICGdsUuUz/cUPW2./zA2W",
      "fullName": "Ken Humphrey Samar",
      "email": "kenhumphrey.samar@ust-legazpi.edu.ph",
      "phone": "09123456789",
      "profilePic": "",
      "userType": "Student",
      "department": "CEAFA",
      "program": "BS Civil Engineering",
      "createdAt": {
        "$date": {
          "$numberLong": "1781929048664"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1781929048664"
        }
      },
      "emergencyContact": {
        "name": "Armand Rey Sariba",
        "relationship": "",
        "contact": "09123456789",
        "address": ""
      },
      "father": {
        "name": "Juan Miguel Samar",
        "occupation": "",
        "contact": "09123456789"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Magi Epiphany Samar",
        "occupation": "",
        "contact": "09123456789"
      }
    },
    {
      "_id": {
        "$numberInt": "66168"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4200420",
      "password": "$2b$10$HS/kxvJBbt1Avw7guP7iHOWGvm1/slwQ20l0ggONAbE2MeejigJFq",
      "fullName": "Russell Estocado",
      "email": "russell.estocado@ust-legazpi.edu.ph",
      "phone": "09123456789",
      "profilePic": "",
      "userType": "Student",
      "department": "CEAFA",
      "program": "BS Computer Science",
      "createdAt": {
        "$date": {
          "$numberLong": "1781929253217"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1781929253217"
        }
      },
      "emergencyContact": {
        "name": "Charles Calima",
        "relationship": "",
        "contact": "09123456789",
        "address": ""
      },
      "father": {
        "name": "Ashley Asa Estocado",
        "occupation": "",
        "contact": "09123456789"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Margaret Estocado",
        "occupation": "",
        "contact": "09123456789"
      }
    },
    {
      "_id": {
        "$numberInt": "96902"
      },
      "__v": {
        "$numberInt": "0"
      },
      "studentId": "4220051",
      "password": "$2b$10$z.ndZPsSRaPAu7xNY.NbGuF/Oou51gomGdqUN5gMpB30flwVOf4pa",
      "fullName": "Steffi Jimei Molaer",
      "email": "steffijimei.molaer@ust-legazpi.edu.ph",
      "phone": "09123456789",
      "profilePic": "",
      "userType": "Student",
      "department": "CHS",
      "program": "BS Nursing",
      "createdAt": {
        "$date": {
          "$numberLong": "1781929369832"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1781929369832"
        }
      },
      "emergencyContact": {
        "name": "Joshua Klein Malonda",
        "relationship": "",
        "contact": "09123456789",
        "address": ""
      },
      "father": {
        "name": "Stephen Molaer",
        "occupation": "",
        "contact": "09123456789"
      },
      "guardian": {
        "name": "",
        "relationship": "",
        "contact": ""
      },
      "mother": {
        "name": "Josephine Molaer",
        "occupation": "",
        "contact": "09123456789"
      }
    }
  ],
  "counselors": [
    {
      "_id": {
        "$numberInt": "15157"
      },
      "__v": {
        "$numberInt": "0"
      },
      "counselorId": "sonnysallena",
      "password": "$2b$10$.KqegDlsxBKM38XegDIehOLhNM9Li9R9iQ5gOrJQ23/d/PS1W4gAS",
      "fullName": "Sonny T. Sallena",
      "profilePic": "",
      "userType": "Counselor",
      "createdAt": {
        "$date": {
          "$numberLong": "1781929497139"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1784597799228"
        }
      },
      "email": "",
      "twoFactorEnabled": false,
      "pin": ""
    },
    {
      "_id": {
        "$numberInt": "62658"
      },
      "__v": {
        "$numberInt": "0"
      },
      "counselorId": "counselorjohndoe",
      "password": "$2b$10$Qdwu9X/pF4.4/WzF9e4i4.vExUPXTJuWfijBvGAjB1HdZIPCD7jgS",
      "fullName": "John Doe",
      "email": "ust.admin@ust-legazpi.edu.ph",
      "profilePic": "",
      "userType": "Counselor",
      "createdAt": {
        "$date": {
          "$numberLong": "1782040043908"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1784597916349"
        }
      },
      "twoFactorEnabled": false,
      "pin": ""
    }
  ],
  "announcements": [
    {
      "_id": {
        "$oid": "6a66add2076434285ca67217"
      },
      "title": "Alumni Tracer Study",
      "body": "The University of Santo Tomas–Legazpi invites all alumni to take part in the Alumni Tracer Study, an initiative that helps assess graduate employability and supports the continuous improvement of the University’s academic programs.\n\nYour response is valuable in shaping the future of Thomasian education. Alumni may access the tracer study Google Form by scanning the QR code provided on the posters.\n\nYour journey continues with us—let your voice be heard and be part of UST–Legazpi’s growth!\n\n#USTLegazpiAlumni\n#USTLegazpiAt78",
      "author": "Counseling Office",
      "views": {
        "$numberInt": "2"
      },
      "viewedBy": [
        {
          "$numberInt": "42609"
        },
        {
          "$numberInt": "96902"
        }
      ],
      "clicks": {
        "$numberInt": "0"
      },
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785114066150"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785151192508"
        }
      },
      "__v": {
        "$numberInt": "2"
      },
      "images": []
    },
    {
      "_id": {
        "$oid": "6a66b32d1e9d90a96d22cc7d"
      },
      "title": "Singe Image Posting",
      "body": "Testing single image posting",
      "images": [
        "https://res.cloudinary.com/dlrn2w2q3/image/upload/v1785117626/fiuyhqcdsfliv7rjl8ih.jpg"
      ],
      "author": "Counseling Office",
      "views": {
        "$numberInt": "2"
      },
      "viewedBy": [
        {
          "$numberInt": "42609"
        },
        {
          "$numberInt": "96902"
        }
      ],
      "clicks": {
        "$numberInt": "0"
      },
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785115437712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785151192501"
        }
      },
      "__v": {
        "$numberInt": "2"
      }
    },
    {
      "_id": {
        "$oid": "6a66bb853bec94a54ec5fd3e"
      },
      "title": "Multiple Image Posting",
      "body": "Testing multiple image posting",
      "images": [
        "https://res.cloudinary.com/dlrn2w2q3/image/upload/v1785117572/pajr3obhf247hiqvnq4f.jpg",
        "https://res.cloudinary.com/dlrn2w2q3/image/upload/v1785117572/givyhsibga7uizjkdfhd.jpg",
        "https://res.cloudinary.com/dlrn2w2q3/image/upload/v1785117572/p9cnpz6qxwpqthdvr2y2.jpg"
      ],
      "author": "Counseling Office",
      "views": {
        "$numberInt": "2"
      },
      "viewedBy": [
        {
          "$numberInt": "42609"
        },
        {
          "$numberInt": "96902"
        }
      ],
      "clicks": {
        "$numberInt": "0"
      },
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785117573393"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785726849736"
        }
      },
      "__v": {
        "$numberInt": "2"
      },
      "reactions": {
        "love": [
          {
            "$numberInt": "42609"
          }
        ],
        "surprise": [
          {
            "$numberInt": "42609"
          }
        ],
        "laugh": [
          {
            "$numberInt": "42609"
          }
        ]
      }
    },
    {
      "_id": {
        "$oid": "6a66bba9082d8b854d830e26"
      },
      "title": "Large Image Posting",
      "body": "Testing large image posting",
      "images": [
        "https://res.cloudinary.com/dlrn2w2q3/image/upload/v1785117608/rjjkb1h7bv42ckytixk7.jpg"
      ],
      "author": "Counseling Office",
      "views": {
        "$numberInt": "2"
      },
      "viewedBy": [
        {
          "$numberInt": "42609"
        },
        {
          "$numberInt": "96902"
        }
      ],
      "clicks": {
        "$numberInt": "0"
      },
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785117609503"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785151192586"
        }
      },
      "__v": {
        "$numberInt": "2"
      }
    },
    {
      "_id": {
        "$oid": "6a6722c152aa8e3fb1b91c62"
      },
      "title": "Link Posting",
      "body": "Testing link posting https://github.com/jshmlnd/ust-legazpi-mhss",
      "images": [],
      "author": "Counseling Office",
      "views": {
        "$numberInt": "2"
      },
      "viewedBy": [
        {
          "$numberInt": "42609"
        },
        {
          "$numberInt": "96902"
        }
      ],
      "clicks": {
        "$numberInt": "0"
      },
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785144001655"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785151192498"
        }
      },
      "__v": {
        "$numberInt": "2"
      }
    }
  ],
  "appointments": [
    {
      "_id": {
        "$oid": "6a65c30c236228aea82a301d"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "ended",
      "date": "2026-07-26",
      "time": "04:19 PM",
      "duration": "45 min",
      "concern": "12312",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1785053964879"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785054762545"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785054775495"
        }
      },
      "studentArchived": true,
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a673ce792b9aa8cbf8d46dc"
      },
      "studentId": {
        "$numberInt": "96902"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-07-27",
      "time": "07:11 PM",
      "duration": "45 min",
      "concern": "asdasd",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1785150695218"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785150701136"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785155771061"
        }
      },
      "aliasId": {
        "$numberInt": "86314"
      },
      "aliasLabel": "STU-86314",
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a6751e9694bbb56f2990f9b"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "archived",
      "date": "2026-07-27",
      "time": "08:41 PM",
      "duration": "45 min",
      "concern": "hi",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156073694"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785156093441"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785156616293"
        }
      },
      "studentArchived": true,
      "aliasId": {
        "$numberInt": "71720"
      },
      "aliasLabel": "STU-71720",
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a69555e0095184f16a8c378"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "ended",
      "date": "2026-07-26",
      "time": "1:00 PM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1785288030562"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785289540629"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785289549190"
        }
      },
      "studentArchived": true,
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a695b5c95fbe9b7f6c43676"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "ended",
      "date": "2026-07-26",
      "time": "11:00 AM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1785289564633"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785289569310"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785289971647"
        }
      },
      "studentArchived": true,
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a69624a1fb5d82408097bf0"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "archived",
      "date": "2026-07-29",
      "time": "10:15 AM",
      "duration": "45 min",
      "concern": "asd",
      "notes": "",
      "studentArchived": true,
      "createdAt": {
        "$date": {
          "$numberLong": "1785291338474"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785291343374"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1785291347261"
        }
      },
      "aliasId": {
        "$numberInt": "76441"
      },
      "aliasLabel": "STU-76441",
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a70430a883867cb8bebe3c0"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "completed",
      "date": "2026-07-26",
      "time": "4:00 PM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785742090446"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785742119414"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787846621349"
        }
      },
      "aliasId": {
        "$numberInt": "23708"
      },
      "aliasLabel": "STU-23708",
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a704313883867cb8bebe3c1"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-03",
      "time": "03:28 PM",
      "duration": "45 min",
      "concern": "qe",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1785742099140"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1785742141419"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1786337956452"
        }
      },
      "aliasId": {
        "$numberInt": "37285"
      },
      "aliasLabel": "STU-37285",
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a90627ecf658ac4f70b2d33"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-27",
      "time": "12:14 AM",
      "duration": "45 min",
      "concern": "test",
      "notes": "",
      "aliasLabel": "STU-27195",
      "createdAt": {
        "$date": {
          "$numberLong": "1787847294764"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "aliasId": {
        "$numberInt": "27195"
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787847304525"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787848615838"
        }
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a906b2ad4401286abd5c633"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "ended",
      "date": "2026-07-26",
      "time": "1:00 PM",
      "duration": "45 min",
      "concern": "asd",
      "notes": "",
      "createdAt": {
        "$date": {
          "$numberLong": "1787849514585"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787849524253"
        }
      },
      "studentArchived": false,
      "endedAt": {
        "$date": {
          "$numberLong": "1787890916185"
        }
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a9071dbf7a8dc6342b03afa"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-27",
      "time": "01:20 AM",
      "duration": "45 min",
      "concern": "test",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787851227651"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787851235649"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787856588342"
        }
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a9086ddf5fa3a6bb2583aec"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-27",
      "time": "02:50 AM",
      "duration": "45 min",
      "concern": "hi",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787856605821"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787856609830"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787856623727"
        }
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a908893f5fa3a6bb2583aed"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-27",
      "time": "02:57 AM",
      "duration": "45 min",
      "concern": "g",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787857043385"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787857045713"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787888640481"
        }
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a910d10346facd08f41af2b"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "declined",
      "date": "2026-08-31",
      "time": "9:00 AM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787890960670"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a910d19346facd08f41af2c"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "declined",
      "date": "2026-08-31",
      "time": "1:00 PM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "studentArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787890969463"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787892447791"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "counselorArchived": true
    },
    {
      "_id": {
        "$oid": "6a9118304a3349c8266fb6ef"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "active",
      "date": "2026-08-30",
      "time": "11:00 AM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "studentArchived": false,
      "counselorArchived": true,
      "createdAt": {
        "$date": {
          "$numberLong": "1787893808768"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787902576134"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787894323197"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a911a264a3349c8266fb736"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-28",
      "time": "01:18 PM",
      "duration": "45 min",
      "concern": "test",
      "notes": "",
      "studentArchived": false,
      "counselorArchived": true,
      "createdAt": {
        "$date": {
          "$numberLong": "1787894310546"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787902576134"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787894323871"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787901166143"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a9134fa344c0b586ba590d7"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Chat",
      "status": "completed",
      "date": "2026-08-28",
      "time": "03:12 PM",
      "duration": "45 min",
      "concern": "asdas",
      "notes": "",
      "studentArchived": false,
      "counselorArchived": true,
      "createdAt": {
        "$date": {
          "$numberLong": "1787901178691"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787902576134"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "startedAt": {
        "$date": {
          "$numberLong": "1787901194168"
        }
      },
      "endedAt": {
        "$date": {
          "$numberLong": "1787902426106"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a91740cae1b42a5c33c4bc5"
      },
      "studentId": {
        "$numberInt": "70928"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "type": "Face-To-Face",
      "status": "pending",
      "date": "2026-08-23",
      "time": "9:00 AM",
      "duration": "45 min",
      "concern": "",
      "notes": "",
      "studentArchived": false,
      "counselorArchived": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787917324159"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787917324159"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    }
  ],
  "audittrails": [],
  "availabilityslots": [
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ff7"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208711"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208711"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ff9"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ffc"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ffd"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ffe"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ff8"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ffa"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a65c018236228aea82a2ffb"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-07-26",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785053208712"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b79"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7a"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7b"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7c"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7d"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7e"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b7f"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b80"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-28",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b81"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b82"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b83"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b84"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b85"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b86"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b87"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b88"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-29",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b89"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8a"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8b"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8c"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8d"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8e"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b8f"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b90"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-26",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b91"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b92"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b93"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b94"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b95"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b96"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557888"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b97"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b98"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-27",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b99"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9a"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9b"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9c"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9d"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9e"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8b9f"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba0"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-25",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba1"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba2"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba3"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba4"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba5"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba6"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba7"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba8"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-24",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8ba9"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8baa"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bab"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bac"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bad"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bae"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8baf"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb0"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-23",
      "time": "9:00 AM",
      "isAvailable": false,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787917324265"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb1"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb2"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "11:00 AM",
      "isAvailable": false,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787893808878"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb3"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb4"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb5"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb6"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb7"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb8"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-30",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bb9"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "10:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bba"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "11:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bbb"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "1:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787890990657"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bbc"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "2:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bbd"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "3:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bbe"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "4:00 PM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bbf"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "8:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a910795d0dc262193db8bc0"
      },
      "counselorId": {
        "$numberInt": "15157"
      },
      "date": "2026-08-31",
      "time": "9:00 AM",
      "isAvailable": true,
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787889557889"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787890991424"
        }
      }
    }
  ],
  "calllogs": [
    {
      "_id": {
        "$oid": "6a67520b694bbb56f2990f9c"
      },
      "callerId": {
        "$numberInt": "15157"
      },
      "callerModel": "Counselor",
      "receiverId": {
        "$numberInt": "42609"
      },
      "receiverModel": "User",
      "duration": {
        "$numberInt": "0"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156107096"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156107096"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a67520b694bbb56f2990f9d"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "5"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156107148"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156107148"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a675213694bbb56f2990f9e"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "0"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156115644"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156115644"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a675213694bbb56f2990f9f"
      },
      "callerId": {
        "$numberInt": "15157"
      },
      "callerModel": "Counselor",
      "receiverId": {
        "$numberInt": "42609"
      },
      "receiverModel": "User",
      "duration": {
        "$numberInt": "4"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156115721"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156115721"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a675221694bbb56f2990fa0"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "0"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156129910"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156129910"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a675221694bbb56f2990fa1"
      },
      "callerId": {
        "$numberInt": "15157"
      },
      "callerModel": "Counselor",
      "receiverId": {
        "$numberInt": "42609"
      },
      "receiverModel": "User",
      "duration": {
        "$numberInt": "5"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156129975"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156129975"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a6753d4a29b091886434868"
      },
      "callerId": {
        "$numberInt": "15157"
      },
      "callerModel": "Counselor",
      "receiverId": {
        "$numberInt": "42609"
      },
      "receiverModel": "User",
      "duration": {
        "$numberInt": "153"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156564645"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156564645"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a6753d5a29b091886434869"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "156"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1785156565311"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785156565311"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a795a7be221bee2f72f751e"
      },
      "callerId": {
        "$numberInt": "15157"
      },
      "callerModel": "Counselor",
      "receiverId": {
        "$numberInt": "42609"
      },
      "receiverModel": "User",
      "duration": {
        "$numberInt": "13"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1786337915045"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1786337915045"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a908666f5fa3a6bb2583aeb"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "38"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1787856486384"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787856486384"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a90957845ace4e5b57ae6c1"
      },
      "callerId": {
        "$numberInt": "42609"
      },
      "callerModel": "User",
      "receiverId": {
        "$numberInt": "15157"
      },
      "receiverModel": "Counselor",
      "duration": {
        "$numberInt": "22"
      },
      "status": "ended",
      "createdAt": {
        "$date": {
          "$numberLong": "1787860344756"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787860344756"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    }
  ],
  "journalentries": [
    {
      "_id": {
        "$oid": "6a66e34275b731d7f5e474b3"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry",
      "mood": "okay",
      "createdAt": {
        "$date": {
          "$numberLong": "1785127746061"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785127746061"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e35275b731d7f5e474b4"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 2",
      "mood": "great",
      "createdAt": {
        "$date": {
          "$numberLong": "1785127762646"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785127762646"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e6895e7a479296718adb"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 3",
      "mood": "bad",
      "createdAt": {
        "$date": {
          "$numberLong": "1785128585756"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785128585756"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e6975e7a479296718adc"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 4",
      "mood": "okay",
      "createdAt": {
        "$date": {
          "$numberLong": "1785128599259"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785128599259"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e6a35e7a479296718add"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 5",
      "mood": "low",
      "createdAt": {
        "$date": {
          "$numberLong": "1785128611341"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785128611341"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e6be5e7a479296718ade"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 6",
      "mood": "good",
      "createdAt": {
        "$date": {
          "$numberLong": "1785128638483"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785128638483"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a66e8f75b5bb4d918b5be63"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "title": "Test entry",
      "content": "Testing journal entry - 7",
      "mood": "okay",
      "createdAt": {
        "$date": {
          "$numberLong": "1785129207856"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785129207856"
        }
      },
      "date": "07-27-2026",
      "__v": {
        "$numberInt": "0"
      }
    }
  ],
  "messages": [],
  "notices": [
    {
      "_id": {
        "$oid": "6a673b4c92b9aa8cbf8d4666"
      },
      "tag": "NOTICE",
      "text": "Counseling services are available for walk-in appointments every Monday and Thursday, 8:00 AM – 4:00 PM at the Office of Guidance and Testing.",
      "linkHref": "/university-updates",
      "linkLabel": "Read latest updates",
      "createdAt": {
        "$date": {
          "$numberLong": "1785150284937"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785291560088"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    }
  ],
  "resources": [
    {
      "_id": {
        "$oid": "6a37c6ad11d8a0fa0d1c5d9d"
      },
      "title": "UST-Legazpi Office of Guidance & Testing",
      "description": "University of Santo Tomas - Legazpi Office of Guidance & Testing",
      "url": "https://maps.app.goo.gl/vSANYB4ZGM9FyUmH6",
      "fileType": "link",
      "tags": [
        "University Services",
        "Free"
      ],
      "author": "Administrator",
      "uploader": {
        "$oid": "6a37c5eb11d8a0fa0d1c5d9c"
      },
      "location": {
        "lat": {
          "$numberDouble": "13.163969"
        },
        "lng": {
          "$numberDouble": "123.749947"
        }
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1782040237991"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787887290078"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "address": "",
      "contact": "",
      "hours": "",
      "lat": {
        "$numberDouble": "13.16392"
      },
      "lng": {
        "$numberDouble": "123.7498754"
      },
      "mapUrl": "https://www.google.com/maps/@13.16392,123.7498754,66m/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI2MDgyNS4wIKXMDSoASAFQAw%3D%3D",
      "order": {
        "$numberInt": "0"
      },
      "type": "location"
    },
    {
      "_id": {
        "$oid": "6a91008ad0dc262193db8961"
      },
      "title": "Dr. Anna Liza Catalina I. Del Rosario, MD",
      "type": "location",
      "description": "A Fellow of the Philippine Psychiatric Association.",
      "url": "",
      "address": "",
      "hours": "",
      "contact": "052-481-1867",
      "mapUrl": "https://www.google.com/maps/place/ALBAY+POLYCLINIC/@13.1396893,123.7345588,1049m/data=!3m1!1e3!4m14!1m7!3m6!1s0x33a103db1b6c3cdf:0xb942917bb29f022c!2sIBALONG+MEDICAL+CENTER!8m2!3d13.1381952!4d123.7373376!16s%2Fg%2F1tj48042!3m5!1s0x33a103dcf105dec5:0xbc3479326dff616b!8m2!3d13.139321!4d123.733065!16s%2Fg%2F1tgby8zm?entry=ttu&g_ep=EgoyMDI2MDgyNS4wIKXMDSoASAFQAw%3D%3D",
      "order": {
        "$numberInt": "3"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787887754546"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787887929527"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "lat": {
        "$numberDouble": "13.1381952"
      },
      "lng": {
        "$numberDouble": "123.7373376"
      }
    },
    {
      "_id": {
        "$oid": "6a9100e2d0dc262193db8962"
      },
      "title": "Dr. Gregorio S. Tan, MD, FPPA",
      "type": "location",
      "description": "An established adult psychiatrist based at Room 104, Tanchuling General Hospital.",
      "url": "",
      "address": "",
      "hours": "",
      "contact": "",
      "mapUrl": "https://www.google.com/maps/place/Tanchuling+General+Hospital,+Inc./@13.1431261,123.7521693,1049m/data=!3m1!1e3!4m6!3m5!1s0x33a1022a3cfbd0c7:0x2a8ecc2dfba05a62!8m2!3d13.1437097!4d123.7519526!16s%2Fg%2F1vn161l2?entry=ttu&g_ep=EgoyMDI2MDgyNS4wIKXMDSoASAFQAw%3D%3D",
      "order": {
        "$numberInt": "4"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787887842505"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787893051845"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "lat": {
        "$numberDouble": "13.1437097"
      },
      "lng": {
        "$numberDouble": "123.7519526"
      }
    },
    {
      "_id": {
        "$oid": "6a91018dd0dc262193db8963"
      },
      "title": "Dr. Ma. Angelli Lorbes-Morico, MD, FPPA",
      "type": "location",
      "description": "",
      "url": "",
      "address": "",
      "hours": "",
      "contact": "0926-715-4456",
      "lat": {
        "$numberDouble": "13.139321"
      },
      "lng": {
        "$numberDouble": "123.733065"
      },
      "mapUrl": "https://www.google.com/maps/place/ALBAY+POLYCLINIC/@13.1430754,123.7287671,2288m/data=!3m1!1e3!4m6!3m5!1s0x33a103dcf105dec5:0xbc3479326dff616b!8m2!3d13.139321!4d123.733065!16s%2Fg%2F1tgby8zm?entry=ttu&g_ep=EgoyMDI2MDgyNS4wIKXMDSoASAFQAw%3D%3D",
      "order": {
        "$numberInt": "3"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787888013210"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787888013210"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a910277d0dc262193db8964"
      },
      "title": "Ronald John Recio, MA, RPsy",
      "type": "location",
      "description": "an experienced clinical psychologist specializing in trauma, anxiety, and depression.",
      "url": "",
      "address": "",
      "hours": "Friday and Saturday from 8:00 AM to 5:00 PM",
      "contact": "",
      "mapUrl": "https://www.google.com/maps/place/Ranga+Psychosocial+Services/@13.1451935,123.7501809,1049m/data=!3m2!1e3!4b1!4m6!3m5!1s0x33a101f09777c249:0x5d2cc570005acfb5!8m2!3d13.1451935!4d123.7501809!16s%2Fg%2F11t10qsn6q?entry=ttu&g_ep=EgoyMDI2MDgyNS4wIKXMDSoASAFQAw%3D%3D",
      "order": {
        "$numberInt": "4"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1787888247319"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787888263972"
        }
      },
      "__v": {
        "$numberInt": "0"
      },
      "lat": {
        "$numberDouble": "13.1451935"
      },
      "lng": {
        "$numberDouble": "123.7501809"
      }
    }
  ],
  "selfcaremodules": [
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627ab"
      },
      "title": "Breathing Exercises",
      "icon": "Wind",
      "activities": [
        {
          "label": "Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s — repeat 4 times",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ac"
          }
        },
        {
          "label": "4-7-8 technique: inhale 4s, hold 7s, exhale 8s — repeat 3 times",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ad"
          }
        },
        {
          "label": "Try a 3-minute guided breathing session",
          "link": "https://www.youtube.com/watch?v=VUjiXcfBnH4",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ae"
          }
        }
      ],
      "order": {
        "$numberInt": "1"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627af"
      },
      "title": "Journaling Prompts",
      "icon": "BookOpen",
      "activities": [
        {
          "label": "Write about one challenge you faced this week and how you handled it",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b0"
          }
        },
        {
          "label": "Describe your ideal day five years from now",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b1"
          }
        },
        {
          "label": "List 5 personal strengths you possess",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b2"
          }
        },
        {
          "label": "Write a letter of encouragement to your future self",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b3"
          }
        }
      ],
      "order": {
        "$numberInt": "2"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627b4"
      },
      "title": "Physical Wellness",
      "icon": "Dumbbell",
      "activities": [
        {
          "label": "Take a 15-minute walk around campus",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b5"
          }
        },
        {
          "label": "Do 10 minutes of stretching or yoga",
          "link": "https://www.youtube.com/watch?v=v7AYKMP6rOE",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b6"
          }
        },
        {
          "label": "Drink at least 8 glasses of water today",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b7"
          }
        },
        {
          "label": "Replace one unhealthy snack with a fruit or nut",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627b8"
          }
        }
      ],
      "order": {
        "$numberInt": "3"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627b9"
      },
      "title": "Sleep Hygiene",
      "icon": "Moon",
      "activities": [
        {
          "label": "Set a consistent bedtime and wake-up time this week",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ba"
          }
        },
        {
          "label": "Put away screens 30 minutes before sleep",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627bb"
          }
        },
        {
          "label": "Try a calming bedtime routine — warm drink, reading, or soft music",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627bc"
          }
        },
        {
          "label": "Listen to a sleep story or ambient sounds",
          "link": "https://www.youtube.com/watch?v=CZ0N9uMlkSk",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627bd"
          }
        }
      ],
      "order": {
        "$numberInt": "4"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627be"
      },
      "title": "Social Connection",
      "icon": "HeartHandshake",
      "activities": [
        {
          "label": "Text or call a friend or family member you haven't spoken to in a while",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627bf"
          }
        },
        {
          "label": "Share a meal with someone and put your phone away",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c0"
          }
        },
        {
          "label": "Give someone a genuine compliment today",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c1"
          }
        },
        {
          "label": "Join a campus club or attend a social event this week",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c2"
          }
        }
      ],
      "order": {
        "$numberInt": "5"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627c3"
      },
      "title": "Stress Relief",
      "icon": "Shield",
      "activities": [
        {
          "label": "Identify your top 3 stressors and write one small action for each",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c4"
          }
        },
        {
          "label": "Practice progressive muscle relaxation — tense and release each muscle group",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c5"
          }
        },
        {
          "label": "Spend 10 minutes in nature or by a window with natural light",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c6"
          }
        },
        {
          "label": "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c7"
          }
        }
      ],
      "order": {
        "$numberInt": "6"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627c8"
      },
      "title": "Creative Expression",
      "icon": "Palette",
      "activities": [
        {
          "label": "Draw, sketch, or doodle for 10 minutes — no pressure, just express",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627c9"
          }
        },
        {
          "label": "Create a playlist of songs that uplift your mood",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ca"
          }
        },
        {
          "label": "Write a short poem or story about your day",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627cb"
          }
        },
        {
          "label": "Try coloring or an adult coloring book for relaxation",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627cc"
          }
        }
      ],
      "order": {
        "$numberInt": "7"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627cd"
      },
      "title": "Digital Detox",
      "icon": "Timer",
      "activities": [
        {
          "label": "Set a 1-hour phone-free block today",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627ce"
          }
        },
        {
          "label": "Turn off non-essential notifications for the day",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627cf"
          }
        },
        {
          "label": "Replace 30 minutes of scrolling with a walk, reading, or hobby",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d0"
          }
        },
        {
          "label": "Unfollow or mute accounts that make you feel anxious or inadequate",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d1"
          }
        }
      ],
      "order": {
        "$numberInt": "8"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    },
    {
      "_id": {
        "$oid": "6a66d72f876a1ace0c2627d2"
      },
      "title": "Positive Affirmations",
      "icon": "Star",
      "activities": [
        {
          "label": "Read these aloud: I am capable. I am enough. I am worthy of good things.",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d3"
          }
        },
        {
          "label": "Write 3 affirmations and place them where you will see them daily",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d4"
          }
        },
        {
          "label": "Look in the mirror and say one kind thing to yourself",
          "link": "",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d5"
          }
        },
        {
          "label": "Listen to a guided affirmations session",
          "link": "https://www.youtube.com/watch?v=5H1kAdUQvQo",
          "completed": false,
          "_id": {
            "$oid": "6a66d72f876a1ace0c2627d6"
          }
        }
      ],
      "order": {
        "$numberInt": "9"
      },
      "__v": {
        "$numberInt": "0"
      },
      "createdAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1785124655103"
        }
      }
    }
  ],
  "suggestions": [
    {
      "_id": {
        "$oid": "6a906f79f7a8dc6342b03af0"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #1",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850617478"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850617478"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f83f7a8dc6342b03af1"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #2",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850627023"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850627023"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f84f7a8dc6342b03af2"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #3",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850628943"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850628943"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f86f7a8dc6342b03af3"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #4",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850630257"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850630257"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f87f7a8dc6342b03af4"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #5",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850631414"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850631414"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f89f7a8dc6342b03af5"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #6",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850633568"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850633568"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f8cf7a8dc6342b03af6"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #7",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850636156"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850636156"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f8ff7a8dc6342b03af7"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #8",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850639167"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850639167"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f90f7a8dc6342b03af8"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #9",
      "isDeleted": false,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850640519"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850640519"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    },
    {
      "_id": {
        "$oid": "6a906f93f7a8dc6342b03af9"
      },
      "studentId": {
        "$numberInt": "42609"
      },
      "message": "Test suggestion #10",
      "isDeleted": true,
      "createdAt": {
        "$date": {
          "$numberLong": "1787850643807"
        }
      },
      "updatedAt": {
        "$date": {
          "$numberLong": "1787850873703"
        }
      },
      "__v": {
        "$numberInt": "0"
      }
    }
  ]
};

const MODELS = {
  users: User,
  counselors: Counselor,
  announcements: Announcement,
  appointments: Appointment,
  audittrails: AuditTrail,
  availabilityslots: AvailabilitySlot,
  calllogs: CallLog,
  journalentries: JournalEntry,
  messages: Message,
  notices: Notice,
  resources: Resource,
  selfcaremodules: SelfCareModule,
  suggestions: Suggestion,
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const [name, Model] of Object.entries(MODELS)) {
    const docs = (DATA[name] || []).map((d) => EJSON.deserialize(d, { relaxed: false }));
    await Model.deleteMany({});
    if (docs.length) await Model.insertMany(docs, { ordered: false });
    console.log(`Seeded ${name}: ${docs.length} documents`);
  }
  console.log("Seeding complete.");
};

seed()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error("Seeding failed:", err);
    mongoose.disconnect();
    process.exit(1);
  });
