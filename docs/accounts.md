# Accounts

The 82 hospitals and clinics bundled with the app, grouped by the area cluster the app puts them in. This file is generated from [`src/js/data/accounts.js`](../src/js/data/accounts.js) by `node scripts/generate-accounts-doc.js`. Edit the data there, not here.

| Status | Count | Meaning |
|---|---|---|
| ✅ Confirmed | 55 | The name matched a single place. |
| ⚠️ Best guess | 23 | The name was unclear or several branches exist. The pin is the likeliest match and the app asks the user to confirm it. |
| 📍 Needs location | 4 | No match was found. The app asks the user to set the location on their first visit. |

Pins are accurate to within a few hundred metres, which is enough for choosing transport. The Maps button in the app searches each hospital by name.

## Andheri East

| Account | Area | Status | Notes |
|---|---|---|---|
| Seven Hills | Marol, Andheri E | ✅ Confirmed |  |
| Criticare Hospital | Andheri E (Teli Galli) | ⚠️ Best guess | Please check which branch: placed at Teli Galli, Andheri E. Others: Gulmohar Rd JVPD (main), Kirol Rd Kurla W, New Link Rd Malad W |
| Nakshatra Multispeciality Hospital | MIDC, Andheri E | ✅ Confirmed |  |
| Holy Spirit Hospital | Mahakali Caves Rd, Andheri E | ✅ Confirmed |  |
| Esees Hospital | MIDC, Andheri E | ⚠️ Best guess | Read as ESIC Hospital, MIDC Andheri E |

## Juhu & Vile Parle

| Account | Area | Status | Notes |
|---|---|---|---|
| Aarogyardhi Hospital | Juhu (JVPD) | ⚠️ Best guess | Please check: probably Bhartiya Arogya Nidhi Hospital, JVPD Juhu (same building as Ravi Endoscopy Centre) |
| Hbt Medical College And Dr Rustom Nana Cooper Municipal General Hospital | Juhu / Vile Parle W | ✅ Confirmed | Listed twice in the original list |
| Nanavati Super Speciality Hospital | Vile Parle W | ✅ Confirmed |  |
| Ravi Endoscopy Centre | Juhu (JVPD) | ✅ Confirmed | Inside Bhartiya Arogya Nidhi Hospital |
| Sujay Hospital | Vile Parle W (Juhu) | ✅ Confirmed |  |
| Criticare Asia Multispecialty Hospital | Juhu (JVPD, Gulmohar Rd) | ⚠️ Best guess | Please check which branch: placed at Gulmohar Rd, JVPD (main). Others: Teli Galli Andheri E, Kirol Rd Kurla W, New Link Rd Malad W |

## Andheri West & Goregaon

| Account | Area | Status | Notes |
|---|---|---|---|
| Belle Vue Andheri | Andheri W (New Link Rd) | ✅ Confirmed |  |
| Oscar Hospital | Goregaon W (New Link Rd) | ⚠️ Best guess | Other branch: Kandivali W (Old Link Rd) |
| Sbs Hospital | Andheri W (Veera Desai Rd) | ✅ Confirmed |  |
| Mandee Foundation Hospital | Andheri W (4 Bungalows) | ⚠️ Best guess | Mandke Foundation is the trust behind Kokilaben Hospital |

## Malad & Kandivali

| Account | Area | Status | Notes |
|---|---|---|---|
| Uninati Hospital | Kandivali W (SV Road) | ⚠️ Best guess | Please check: placed at Unnati Hospital, SV Road, Kandivali W. Another Unnati is in New Panvel (Shivaji Chowk). Fix the pin if it is that one |
| Suchak Hospital | Malad E | ✅ Confirmed |  |
| Kaachia's Endoscopy Centre | Malad W (Evershine Nagar, New Link Rd) | ⚠️ Best guess | Address added for you; please check it is the right centre |
| Gokul Hospital Trust | Kandivali E | ⚠️ Best guess | Gokul Hospital also has Mulund W and Kalina branches |
| Namah Hospital | Kandivali W (SV Road) | ✅ Confirmed |  |
| Sanjeevani Hospital | Malad E | ⚠️ Best guess |  |
| Mangal Murti Hospital And | Kandivali W | ⚠️ Best guess | Several Mangal Murti hospitals exist (Borivali, Malvani, Bhayandar) |

## Borivali & Dahisar

| Account | Area | Status | Notes |
|---|---|---|---|
| Lotus Multispecialty Hospital | Borivali W (Link Road) | ⚠️ Best guess | Please check which branch: placed at Link Road, Borivali W. Others are on Datta Mandir Rd, Bhandup W and MG Road, Kandivali W |
| Apex Hospital, Borivali | Borivali W | ✅ Confirmed |  |
| Pragati Multispeciality Hospital | Dahisar E | ⚠️ Best guess |  |
| Arihant Gastroenterology Center | Borivali W (SV Road) | ✅ Confirmed |  |
| Dr Mohina Khanna Clinic | Borivali W | ⚠️ Best guess | Possibly Dr Molina Khanna (gastroenterologist), Borivali W |
| Karuna Hospital | Borivali W | ✅ Confirmed |  |

## Mira Road

| Account | Area | Status | Notes |
|---|---|---|---|
| Thunga Mira Road | Mira Road E | ✅ Confirmed |  |
| Wockhardt Hospital Mira Road | Mira Road E | ✅ Confirmed |  |

## Bandra, Mahim & Dadar

| Account | Area | Status | Notes |
|---|---|---|---|
| Holy Family Hospital | Bandra W | ✅ Confirmed |  |
| Sushrusha Dadar | Dadar W | ✅ Confirmed |  |
| P D Hinduja National Hospital | Mahim | ✅ Confirmed |  |
| Guru Nanak Hospital | Bandra E | ✅ Confirmed |  |

## Parel medical hub

| Account | Area | Status | Notes |
|---|---|---|---|
| Haffkine Bio Pharmaceuticals | Parel | ✅ Confirmed |  |
| Tata Memorial Hospital | Parel | ✅ Confirmed |  |
| Global Hospital | Parel | ✅ Confirmed | Now Gleneagles Hospital, Parel |
| Bai Jerbai Wadia Hospital For Children | Parel | ✅ Confirmed |  |

## Mumbai Central & Pedder Road

| Account | Area | Status | Notes |
|---|---|---|---|
| Jagjivanram Hospital | Mumbai Central | ✅ Confirmed |  |
| Hbt Nair Hospital | Mumbai Central | ✅ Confirmed | BYL Nair Hospital |
| Jaslok Hospital & Research | Pedder Road | ✅ Confirmed |  |
| Wockhardt Hospitals Limited | Mumbai Central | ✅ Confirmed |  |
| Breach Candy Hospital | Breach Candy | ✅ Confirmed |  |
| Bhalia Hospital | Tardeo | ⚠️ Best guess | Read as Bhatia Hospital, Tardeo |
| Digestive Disease And Endoscopy | Grant Road | ⚠️ Best guess |  |
| Nh Sirc Children's Hospital | Haji Ali | ✅ Confirmed |  |
| Am Institute Of Gi & Mumbai | Kemps Corner (August Kranti Marg) | ✅ Confirmed |  |
| Apollo Spectra Hospital, Tardeo | Tardeo | ✅ Confirmed |  |

## Girgaon, Fort & Colaba

| Account | Area | Status | Notes |
|---|---|---|---|
| Jj Hospital | Byculla | ✅ Confirmed |  |
| Sir H. N. Reliance Foundation Hospital | Girgaon | ✅ Confirmed |  |
| Saifee Hospital | Charni Road | ✅ Confirmed |  |
| Municipal Corporation Of Greater Mumbai | CSMT (head office) | ⚠️ Best guess | Assumed the head office opposite CSMT |
| Sir Hurkisondas Nurrotumdas Sarvajanik Hospital | Girgaon | ✅ Confirmed | Same campus as Sir H. N. Reliance Foundation Hospital |
| Sir Hrn Hospital Trust | Girgaon | ✅ Confirmed | Same campus as Sir H. N. Reliance Foundation Hospital |
| Bombay Hospital | Marine Lines | ✅ Confirmed |  |
| Hcg Hospital, Colaba | Colaba | ✅ Confirmed |  |

## Sion, Kurla & Chembur

| Account | Area | Status | Notes |
|---|---|---|---|
| K J Somaiya Hospital & Research | Sion E | ✅ Confirmed |  |
| Zen Hospital | Chembur | ✅ Confirmed |  |
| Mahatma Education Campus | Chembur Naka | ⚠️ Best guess | Please check: placed at the Mahatma Education Society campus, Chembur Naka. MES also has a New Panvel campus (Pillai) |
| Lokmanya Tilak Municipal Hospital | Sion | ✅ Confirmed |  |
| Kohinoor Hospital | Kurla W | ✅ Confirmed |  |
| Asian Institute Of Oncology | Sion (Somaiya Ayurvihar) | ✅ Confirmed | Listed twice in the original list |
| Apollo Spectra | Chembur | ⚠️ Best guess | The Tardeo branch is listed separately, so this is taken as Chembur |

## Ghatkopar, Powai & Vikhroli

| Account | Area | Status | Notes |
|---|---|---|---|
| Zynova Shalby, Ghatkopar | Ghatkopar W | ✅ Confirmed |  |
| Hiranandani Healthcare Pvt. Ltd. | Powai | ✅ Confirmed |  |
| Godrej Memorial Hospital | Vikhroli E | ✅ Confirmed |  |

## Mulund & Thane

| Account | Area | Status | Notes |
|---|---|---|---|
| Upasani Hospital, Mulund | Mulund W | ✅ Confirmed |  |
| Fortis Hospital Limited | Mulund W | ⚠️ Best guess | Read as Fortis Hospital, Mulund |
| Horizon Hospital | Thane W (Ghodbunder Rd) | ⚠️ Best guess | Read as Horizon Prime, Thane. Another branch is in Naupada, Thane |

## Vashi & Kopar Khairane

| Account | Area | Status | Notes |
|---|---|---|---|
| Mgro Vashi | Vashi | ✅ Confirmed | MGM New Bombay Hospital |
| Fortis Hospital Vashi | Vashi | ✅ Confirmed |  |
| Reliance Hospital, Navi Mumbai | Kopar Khairane | ✅ Confirmed |  |
| New Era Superspeciality Hospital | Vashi (Sector 7) | ⚠️ Best guess | Please check: placed at New Era Hospital, Plot 48–49, Sector 7, Vashi (the only New Era found in the Mumbai area) |

## Nerul & Kharghar

| Account | Area | Status | Notes |
|---|---|---|---|
| D.Y Patil Hospital | Nerul | ✅ Confirmed |  |
| Tata Memorial Hospital, Actec | Kharghar | ✅ Confirmed |  |
| Terna Medical College & Hospital | Nerul W | ✅ Confirmed |  |

## Dombivli & Kalyan

| Account | Area | Status | Notes |
|---|---|---|---|
| Aiims Hospital | Dombivli East | ⚠️ Best guess | Please check: probably AIMS (Asian Institute of Medical Sciences), MIDC Dombivli E. There is no AIIMS in Mumbai |
| Fortis Kalyan | Kalyan W | ✅ Confirmed |  |

## No location yet

| Account | Area | Status | Notes |
|---|---|---|---|
| Apollo Endoscopy Centre | – | 📍 Needs location | Location unknown. Please set it next time you visit |
| Inko Apollo | – | 📍 Needs location | Location unknown. Please set it next time you visit |
| Ivy Hospital | – | 📍 Needs location | Location unknown. Please set it next time you visit (an IVY Speciality Clinic in Kalina, Santacruz E is one possibility) |
| Gastrocare Dr S.P. | – | 📍 Needs location | Location unknown. Please set it next time you visit |

