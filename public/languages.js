// Display copy only. Stored values, identifiers and user-entered text are never translated.
import { extraMessages } from "./language-extra.js";
export const messages = Object.fromEntries(
  `
Settings|सेटिंग्ज|सेटिंग
Language|भाषा|भाषा
Choose the language you find easiest to read.|तुम्हाला वाचायला सोपी वाटणारी भाषा निवडा.|जिस भाषा में पढ़ना आसान लगे, उसे चुनें।
Save language|भाषा जतन करा|भाषा सेव करें
Only screen text changes. Your saved records, amounts and references stay the same.|फक्त पडद्यावरील मजकूर बदलेल. जतन केलेल्या नोंदी, रक्कम आणि संदर्भ बदलणार नाहीत.|सिर्फ स्क्रीन पर लिखे शब्द बदलेंगे। सेव की गई जानकारी, रकम और संदर्भ नहीं बदलेंगे।
This choice is saved in this browser and works without internet.|ही निवड याच ब्राउझरमध्ये जतन होईल आणि इंटरनेटशिवाय वापरता येईल.|यह चुनाव इसी ब्राउज़र में सेव होगा और बिना इंटरनेट काम करेगा।
Please tick this box to confirm.|खात्री करण्यासाठी या चौकटीत खूण करा.|पुष्टि के लिए इस खाने पर निशान लगाएँ।
Please fill in this field.|कृपया ही माहिती भरा.|कृपया यह जानकारी भरें।
Enter a value within the allowed range.|दिलेल्या मर्यादेत संख्या भरा.|दी गई सीमा के अंदर संख्या भरें।
Please check this value and enter it again.|ही माहिती तपासून पुन्हा भरा.|यह जानकारी जाँचकर फिर भरें।
Financial dashboard|पैशांचा आढावा|पैसों का सार
Search & Payment ID 360|शोध आणि पेमेंटचा पूर्ण तपशील|खोज और पेमेंट की पूरी जानकारी
Reports & exports|अहवाल आणि फाइल डाउनलोड|रिपोर्ट और फ़ाइल डाउनलोड
Workspace overview|कामाचा आढावा|काम का सार
Government receipts|सरकारकडून आलेले पैसे|सरकार से मिले पैसे
Claims & instalments|देय बिले आणि हप्ते|देय बिल और किस्तें
Outward payments|केलेली देयके|किए गए भुगतान
Bank book|बँकेचा हिशोब|बैंक का हिसाब
Bank reconciliation|बँक हिशोब जुळवणी|बैंक हिसाब का मिलान
Other bank movements|बँकेचे इतर व्यवहार|बैंक के अन्य लेनदेन
Reconciled periods|हिशोब जुळवलेले कालावधी|हिसाब मिलान की अवधि
Tax register|कराच्या नोंदी|कर का रजिस्टर
Tax treatments|कर मोजण्याचे नियम|कर की गणना के नियम
Societies|संस्था|संस्थाएँ
Departments|विभाग|विभाग
Projects & work orders|कामे आणि कामाचे आदेश|काम और काम के आदेश
Bank accounts|बँक खाती|बैंक खाते
Beneficiaries|पैसे घेणाऱ्या व्यक्ती व संस्था|पैसे पाने वाले लोग और संस्थाएँ
Audit history|बदलांचा इतिहास|बदलाव का इतिहास
Numbering|नोंद क्रमांक|रिकॉर्ड नंबर
Backup & recovery|बॅकअप आणि माहिती परत आणणे|बैकअप और जानकारी वापस लाना
Master records|मुख्य माहिती|मुख्य जानकारी
Workspace controls|कामाच्या सेटिंग्ज|काम की सेटिंग
Funds workspace|पैशांचा हिशोब|पैसों का हिसाब
Trace receipts, claims and payments locally.|आलेले पैसे, बिले आणि देयके इथे तपासा.|मिले पैसे, बिल और भुगतान यहाँ जाँचें।
Menu|मेनू|मेन्यू
Labour Society administration|मजूर संस्थेचे कामकाज|मज़दूर संस्था का कामकाज
Offline workspace|इंटरनेटशिवाय काम|बिना इंटरनेट काम
Saved on this computer|या संगणकावर जतन केलेले|इस कंप्यूटर पर सेव है
Loading records…|नोंदी उघडत आहेत…|रिकॉर्ड खुल रहे हैं…
Opening your workspace…|तुमचे काम उघडत आहे…|आपका काम खुल रहा है…
Skip to content|मुख्य मजकुराकडे जा|मुख्य जानकारी पर जाएँ
Primary|मुख्य मेनू|मुख्य मेन्यू
Your records, ready for work.|तुमच्या नोंदी, कामासाठी तयार.|आपके रिकॉर्ड, काम के लिए तैयार।
Build the foundation for tracing Government receipts to their utilisation.|सरकारकडून आलेले पैसे कुठे वापरले ते पाहण्यासाठी मुख्य माहिती भरा.|सरकार से मिले पैसों का उपयोग देखने के लिए मुख्य जानकारी भरें।
Set up your Society workspace|तुमच्या संस्थेची माहिती भरा|अपनी संस्था की जानकारी भरें
Follow the record links below. Your changes are saved with an audit trail.|खालील दुव्यांवरून माहिती भरा. केलेल्या बदलांची नोंद राहते.|नीचे दिए लिंक से जानकारी भरें। किए गए बदलाव दर्ज रहते हैं।
Create your Society|तुमची संस्था जोडा|अपनी संस्था जोड़ें
Set up its identity and effective-dated defaults.|संस्थेची ओळख आणि लागू होणाऱ्या तारखेसह सेटिंग्ज भरा.|संस्था की पहचान और लागू होने की तारीख के साथ सेटिंग भरें।
Add a Government department|सरकारी विभाग जोडा|सरकारी विभाग जोड़ें
Keep divisions and office references together.|विभाग आणि कार्यालयाचे संदर्भ एकत्र ठेवा.|विभाग और कार्यालय के संदर्भ साथ रखें।
Link your work orders|कामाचे आदेश जोडा|काम के आदेश जोड़ें
Connect each project to its Society and department.|प्रत्येक काम त्याच्या संस्था आणि विभागाला जोडा.|हर काम को उसकी संस्था और विभाग से जोड़ें।
Establish the opening balance and effective date.|सुरुवातीची शिल्लक आणि लागू तारीख भरा.|शुरुआती बाकी रकम और लागू तारीख भरें।
Add the people you pay|ज्यांना पैसे देता त्यांना जोडा|जिन्हें पैसे देते हैं उन्हें जोड़ें
View records|नोंदी पाहा|रिकॉर्ड देखें
Open register|नोंदवही उघडा|रजिस्टर खोलें
Society|संस्था|संस्था
society|संस्था|संस्था
department|विभाग|विभाग
project|काम|काम
bank account|बँक खाते|बैंक खाता
beneficiary|पैसे घेणारी व्यक्ती किंवा संस्था|पैसे पाने वाला व्यक्ति या संस्था
Department|विभाग|विभाग
Project|काम|काम
Bank account|बँक खाते|बैंक खाता
Beneficiary|पैसे घेणारी व्यक्ती किंवा संस्था|पैसे पाने वाला व्यक्ति या संस्था
Add {0}|{0} जोडा|{0} जोड़ें
Add|जोडा|जोड़ें
Edit|बदला|बदलें
Edit record|नोंद बदला|रिकॉर्ड बदलें
Create record|नोंद तयार करा|रिकॉर्ड बनाएँ
Save changes|बदल जतन करा|बदलाव सेव करें
Save draft|मसुदा जतन करा|ड्राफ्ट सेव करें
Cancel|रद्द करा|रद्द करें
Back to register|नोंदवहीकडे परत जा|रजिस्टर पर वापस जाएँ
Back to {0}|{0} कडे परत जा|{0} पर वापस जाएँ
record|नोंद|रिकॉर्ड
records|नोंदी|रिकॉर्ड
register|नोंदवही|रजिस्टर
Record|नोंद|रिकॉर्ड
Record details|नोंदीचा तपशील|रिकॉर्ड की जानकारी
Search records|नोंदी शोधा|रिकॉर्ड खोजें
Name, ID or reference|नाव, क्रमांक किंवा संदर्भ|नाम, नंबर या संदर्भ
Status|स्थिती|स्थिति
All statuses|सर्व स्थिती|सभी स्थितियाँ
All Societies|सर्व संस्था|सभी संस्थाएँ
Apply filters|निवड लागू करा|चुनाव लागू करें
Clear filters|निवड काढा|चुनाव हटाएँ
Private details are masked|खाजगी माहिती लपवलेली आहे|निजी जानकारी छिपी है
Name / ID|नाव / क्रमांक|नाम / नंबर
Updated|बदलाची तारीख|बदलाव की तारीख
Open|उघडा|खोलें
Open {0}|{0} उघडा|{0} खोलें
No matching records|जुळणाऱ्या नोंदी नाहीत|मिलते हुए रिकॉर्ड नहीं हैं
Change or clear your filters to see more records.|आणखी नोंदी पाहण्यासाठी निवड बदला किंवा काढा.|और रिकॉर्ड देखने के लिए चुनाव बदलें या हटाएँ।
Keep the details accurate. Required fields are marked.|अचूक माहिती भरा. आवश्यक माहितीची खूण दिली आहे.|सही जानकारी भरें। ज़रूरी जानकारी पर निशान है।
Active|चालू|चालू
Inactive|बंद|बंद
Not specified|दिलेली नाही|नहीं दी गई
Not provided|दिलेली नाही|नहीं दी गई
Yes|होय|हाँ
No|नाही|नहीं
Account|खाते|खाता
Code|संकेत क्रमांक|कोड
Division|उपविभाग|शाखा
Work order|कामाचा आदेश|काम का आदेश
Category|प्रकार|प्रकार
Select {0}|{0} निवडा|{0} चुनें
{0} (required)|{0} (आवश्यक)|{0} (ज़रूरी)
 (required)| (आवश्यक)| (ज़रूरी)
Cannot change after creation.|एकदा तयार केल्यावर बदलता येत नाही.|बनाने के बाद बदला नहीं जा सकता।
Society identity|संस्थेची ओळख|संस्था की पहचान
Financial settings|पैशांच्या सेटिंग्ज|पैसों की सेटिंग
Contacts and notes|संपर्क आणि टिपा|संपर्क और नोट्स
Society name|संस्थेचे नाव|संस्था का नाम
Society code|संस्थेचा संकेत क्रमांक|संस्था का कोड
Registration number|नोंदणी क्रमांक|रजिस्ट्रेशन नंबर
GST applicable|GST लागू आहे का|GST लागू है क्या
GST rate (%)|GST दर (%)|GST दर (%)
Working percentage (%)|कामाची टक्केवारी (%)|काम का प्रतिशत (%)
Effective from|या तारखेपासून लागू|इस तारीख से लागू
Chairman name|अध्यक्षांचे नाव|अध्यक्ष का नाम
Chairman phone|अध्यक्षांचा फोन|अध्यक्ष का फ़ोन
Security contact name|सुरक्षा संपर्काचे नाव|सुरक्षा संपर्क का नाम
Security contact phone|सुरक्षा संपर्काचा फोन|सुरक्षा संपर्क का फ़ोन
Address|पत्ता|पता
Configuration notes|सेटिंग्जबद्दल टिपा|सेटिंग के नोट्स
Department name|विभागाचे नाव|विभाग का नाम
Department type|विभागाचा प्रकार|विभाग का प्रकार
Contact person|संपर्क व्यक्ती|संपर्क व्यक्ति
Contact email|संपर्क ईमेल|संपर्क ईमेल
Contact phone|संपर्क फोन|संपर्क फ़ोन
Project name|कामाचे नाव|काम का नाम
Work order number|कामाच्या आदेशाचा क्रमांक|काम के आदेश का नंबर
Work order date|कामाच्या आदेशाची तारीख|काम के आदेश की तारीख
Approved contract value (INR)|मंजूर कराराची रक्कम (₹)|मंज़ूर करार की रकम (₹)
Expected end date|काम पूर्ण होण्याची अपेक्षित तारीख|काम पूरा होने की अनुमानित तारीख
Actual completion date|काम पूर्ण झाल्याची तारीख|काम पूरा होने की तारीख
Project status|कामाची स्थिती|काम की स्थिति
Account nickname|खात्याचे ओळखीचे नाव|खाते का पहचान नाम
Bank name|बँकेचे नाव|बैंक का नाम
Branch|शाखा|शाखा
Account number|खाते क्रमांक|खाता नंबर
Account type|खात्याचा प्रकार|खाते का प्रकार
Opening balance (INR)|सुरुवातीची शिल्लक (₹)|शुरुआती बाकी रकम (₹)
Opening balance date|सुरुवातीच्या शिल्लकीची तारीख|शुरुआती बाकी रकम की तारीख
Bank beneficiary name|खातेधारकाचे नाव|खाताधारक का नाम
Beneficiary name|पैसे घेणाऱ्याचे नाव|पैसे पाने वाले का नाम
Beneficiary category|पैसे घेणाऱ्याचा प्रकार|पैसे पाने वाले का प्रकार
Phone|फोन|फ़ोन
Notes|टिपा|नोट्स
Reason for change|बदलाचे कारण|बदलाव का कारण
Duplicate-name justification (if needed)|सारखे नाव ठेवण्याचे कारण (गरज असल्यास)|एक जैसा नाम रखने का कारण (ज़रूरत हो तो)
Reveal masked details|लपवलेली माहिती पाहा|छिपी जानकारी देखें
Detail view recorded|माहिती पाहिल्याची नोंद झाली|जानकारी देखने का रिकॉर्ड बन गया
Change history|बदलांचा इतिहास|बदलाव का इतिहास
Times shown in India Standard Time|वेळ भारताच्या वेळेनुसार दाखवली आहे|समय भारतीय मानक समय के अनुसार है
View recorded changes|नोंदवलेले बदल पाहा|दर्ज बदलाव देखें
No audit events are visible for this record.|या नोंदीसाठी बदलांचा इतिहास नाही.|इस रिकॉर्ड के लिए बदलाव का इतिहास नहीं है।
Check the following fields:|खालील माहिती तपासा:|नीचे दी गई जानकारी जाँचें:
Could not open this page|हे पान उघडता आले नाही|यह पेज नहीं खुला
Your records have not been changed.|तुमच्या नोंदी बदललेल्या नाहीत.|आपके रिकॉर्ड नहीं बदले हैं।
Try again|पुन्हा प्रयत्न करा|फिर कोशिश करें
This page is not available. Use the navigation to open a workspace page.|हे पान उपलब्ध नाही. मेनूमधून दुसरे पान उघडा.|यह पेज उपलब्ध नहीं है। मेन्यू से दूसरा पेज खोलें।
Could not reach the local workspace. Start FundTrace on this computer and try again.|FundTrace शी संपर्क झाला नाही. या संगणकावर FundTrace सुरू करून पुन्हा प्रयत्न करा.|FundTrace से संपर्क नहीं हुआ। इस कंप्यूटर पर FundTrace चालू करके फिर कोशिश करें।
Supplier|पुरवठादार|सामान देने वाला
Sub-contractor|उपकंत्राटदार|उप-ठेकेदार
Labour contractor|मजूर ठेकेदार|मज़दूर ठेकेदार
Individual labourer|वैयक्तिक मजूर|व्यक्तिगत मज़दूर
Current|चालू खाते|चालू खाता
Savings|बचत खाते|बचत खाता
Planned|नियोजित|योजना में
In Progress|काम सुरू|काम चालू
Completed|पूर्ण झाले|पूरा हुआ
On Hold|थांबवलेले|रोका गया
Closed|बंद केलेले|बंद किया गया
Draft|मसुदा|ड्राफ्ट
Draft — unposted|मसुदा — हिशोबात धरलेला नाही|ड्राफ्ट — हिसाब में शामिल नहीं
Approved|मंजूर|मंज़ूर
Submitted|तपासणीसाठी दिलेले|जाँच के लिए दिया गया
Posted|हिशोबात नोंद झालेले|हिसाब में दर्ज
Cancelled|रद्द केलेले|रद्द किया गया
Failed|अयशस्वी|असफल
Reversed|उलट नोंद केलेली|उलटी एंट्री की गई
Returned|परत आलेले|वापस आया
Fully paid|पूर्ण दिलेले|पूरा दिया गया
Part paid|काही रक्कम दिलेली|कुछ रकम दी गई
Unpaid|पैसे दिलेले नाहीत|पैसे नहीं दिए गए
Cheque|धनादेश|चेक
Cash|रोख|नकद
Other|इतर|अन्य
Amount|रक्कम|रकम
Amount (INR)|रक्कम (₹)|रकम (₹)
Date|तारीख|तारीख
Reference|संदर्भ|संदर्भ
Reason|कारण|कारण
Evidence|पुरावा|सबूत
Evidence reference|पुराव्याचा संदर्भ|सबूत का संदर्भ
Action|कृती|कार्रवाई
Balance|शिल्लक|बाकी रकम
Credit|जमा|जमा
Debit|खर्च|खर्च
Bank|बँक|बैंक
Receipt|जमा नोंद|जमा रिकॉर्ड
Payment|देयक|भुगतान
Claim|देय बिल|देय बिल
claim|देय बिल|देय बिल
payment|देयक|भुगतान
receipt|जमा नोंद|जमा रिकॉर्ड
Tax|कर|कर
Local workspace|या संगणकावरील काम|इस कंप्यूटर का काम
Restricted|लपवलेले|छिपा हुआ
Transaction numbering|व्यवहारांचे क्रमांक|लेनदेन के नंबर
Receipt:|जमा नोंद:|जमा रिकॉर्ड:
Outward:|देयक:|भुगतान:
{0} IDs issued|{0} क्रमांक दिले|{0} नंबर दिए गए
Immutable master IDs are assigned atomically and never reused.|मुख्य नोंदींचे क्रमांक आपोआप दिले जातात. ते बदलत नाहीत किंवा पुन्हा वापरले जात नाहीत.|मुख्य रिकॉर्ड के नंबर अपने आप बनते हैं। वे बदलते नहीं और दोबारा इस्तेमाल नहीं होते।
Latest 250 local events. Changes retain before and after values; sensitive fields are masked.|शेवटचे २५० बदल. बदलापूर्वीची आणि नंतरची माहिती ठेवली जाते; खाजगी माहिती लपवलेली असते.|पिछले २५० बदलाव। बदलाव से पहले और बाद की जानकारी रखी जाती है; निजी जानकारी छिपी रहती है।
Inactive records remain available in history.|बंद नोंदी इतिहासात पाहता येतात.|बंद रिकॉर्ड इतिहास में देख सकते हैं।
Use the actual bank opening balance. It is separate from receipt allocation balances.|बँकेची खरी सुरुवातीची शिल्लक भरा. ती जमा नोंदीतील वाटपाच्या शिल्लकीपेक्षा वेगळी आहे.|बैंक की असली शुरुआती बाकी रकम भरें। यह जमा रिकॉर्ड की बाँटने योग्य रकम से अलग है।
GST rate is configuration only. Tax credits never create cash. Society code cannot change after creation.|GST दर ही फक्त सेटिंग आहे. कराची जमा रोख रक्कम वाढवत नाही. संस्थेचा संकेत क्रमांक नंतर बदलता येत नाही.|GST दर केवल सेटिंग है। कर का क्रेडिट नकद नहीं बढ़ाता। संस्था का कोड बाद में नहीं बदल सकता।
Record receipt|जमा नोंद करा|जमा दर्ज करें
Receiving bank account|पैसे आलेले बँक खाते|पैसे मिलने वाला बैंक खाता
Bank credit date|बँकेत जमा झाल्याची तारीख|बैंक में जमा होने की तारीख
Value date|बँकेने रक्कम लागू केलेली तारीख|बैंक में रकम लागू होने की तारीख
Credited amount (INR)|जमा झालेली रक्कम (₹)|जमा हुई रकम (₹)
Credited amount|जमा झालेली रक्कम|जमा हुई रकम
Payment mode|पैसे देण्याची पद्धत|भुगतान का तरीका
UTR / bank reference|UTR / बँकेचा संदर्भ|UTR / बैंक का संदर्भ
Cheque number|धनादेश क्रमांक|चेक नंबर
Bill number|बिल क्रमांक|बिल नंबर
Bill type|बिलाचा प्रकार|बिल का प्रकार
Gross bill amount (INR)|बिलाची पूर्ण रक्कम (₹)|बिल की पूरी रकम (₹)
GST deduction (INR)|GST कपात (₹)|GST कटौती (₹)
Tax credit annotation (INR)|कर जमा रकमेची टिप (₹)|कर क्रेडिट रकम का नोट (₹)
Narration|तपशील|विवरण
Drafts do not affect balances or receive a Payment ID.|मसुद्यामुळे शिल्लक बदलत नाही आणि पेमेंट क्रमांक मिळत नाही.|ड्राफ्ट से बाकी रकम नहीं बदलती और पेमेंट नंबर नहीं मिलता।
Edit receipt draft|जमा नोंदीचा मसुदा बदला|जमा रिकॉर्ड का ड्राफ्ट बदलें
Attach evidence|पुरावा जोडा|सबूत जोड़ें
Post receipt|जमा हिशोबात नोंदवा|जमा हिसाब में दर्ज करें
I confirm this amount was credited to the selected bank account (required)|ही रक्कम निवडलेल्या बँक खात्यात जमा झाली आहे, याची मी खात्री करतो (आवश्यक)|मैं पुष्टि करता हूँ कि यह रकम चुने गए बैंक खाते में जमा हुई है (ज़रूरी)
I reviewed the matches and confirm this is a separate bank credit (required)|मी जुळणाऱ्या नोंदी तपासल्या. ही वेगळी जमा आहे, याची खात्री करतो (आवश्यक)|मैंने मिलती हुई एंट्री जाँची हैं। यह अलग जमा है, इसकी पुष्टि करता हूँ (ज़रूरी)
Duplicate override reason|सारखी नोंद असूनही पुढे जाण्याचे कारण|मिलती एंट्री के बावजूद आगे बढ़ने का कारण
Back to receipts|जमा नोंदींकडे परत जा|जमा रिकॉर्ड पर वापस जाएँ
Final Bill|अंतिम बिल|आखिरी बिल
RA Bill|कामाच्या टप्प्याचे बिल|काम के चरण का बिल
Advance|आगाऊ रक्कम|अग्रिम रकम
Invoice / claim reference|बिल / मागणीचा संदर्भ|बिल / दावे का संदर्भ
Invoice date|बिलाची तारीख|बिल की तारीख
Material / certified work description|सामान / तपासलेल्या कामाचा तपशील|सामान / जाँचे गए काम का विवरण
Attendance / certification reference|हजेरी / काम तपासणीचा संदर्भ|हाज़िरी / काम की जाँच का संदर्भ
RA bill / work stage|चालू बिल / कामाचा टप्पा|चालू बिल / काम का चरण
Work period start|काम सुरू झाल्याची तारीख|काम शुरू होने की तारीख
Work period end|काम संपल्याची तारीख|काम खत्म होने की तारीख
Days / quantity|दिवस / प्रमाण|दिन / मात्रा
Rate (INR)|दर (₹)|दर (₹)
GST invoice details|GST बिलाचा तपशील|GST बिल की जानकारी
Gross claim including GST (INR)|GST सह बिलाची पूर्ण रक्कम (₹)|GST सहित बिल की पूरी रकम (₹)
GST included in gross (INR)|पूर्ण रकमेत धरलेला GST (₹)|पूरी रकम में शामिल GST (₹)
TDS deduction (INR)|TDS कपात (₹)|TDS कटौती (₹)
Retention (INR)|राखून ठेवलेली रक्कम (₹)|रोककर रखी रकम (₹)
Other deduction (INR)|इतर कपात (₹)|अन्य कटौती (₹)
Paying bank account|पैसे दिलेले बँक खाते|पैसे देने वाला बैंक खाता
Bank debit date|बँकेतून पैसे गेल्याची तारीख|बैंक से पैसे जाने की तारीख
Payment remarks|देयकाबद्दल टिपा|भुगतान के नोट्स
New claim|नवे देय बिल|नया देय बिल
New payment|नवे देयक|नया भुगतान
Create a reusable claim for one or more instalments. Approval locks its financial terms.|एक किंवा अधिक हप्त्यांसाठी बिल नोंदवा. मंजुरीनंतर त्याची रक्कम बदलता येत नाही.|एक या अधिक किस्तों के लिए बिल दर्ज करें। मंज़ूरी के बाद उसकी रकम नहीं बदल सकती।
Approve claim|बिल मंजूर करा|बिल मंज़ूर करें
Cancel claim|बिल रद्द करा|बिल रद्द करें
Submit for review|तपासणीसाठी द्या|जाँच के लिए दें
Approve payment|देयक मंजूर करा|भुगतान मंज़ूर करें
Post payment|देयक हिशोबात नोंदवा|भुगतान हिसाब में दर्ज करें
Cancel payment|देयक रद्द करा|भुगतान रद्द करें
Confirm action|कृतीची खात्री करा|कार्रवाई की पुष्टि करें
I reviewed this record and confirm the selected action (required)|मी ही नोंद तपासली असून निवडलेल्या कृतीची खात्री करतो (आवश्यक)|मैंने यह रिकॉर्ड जाँचा है और चुनी कार्रवाई की पुष्टि करता हूँ (ज़रूरी)
Local confirmation records your decision. Only posting affects cash and allocations. Posting records a payment already made; it does not send money.|तुमचा निर्णय इथे नोंदवला जातो. हिशोबात नोंद केल्यावरच शिल्लक आणि वाटप बदलते. यात आधी दिलेल्या पैशांची नोंद होते; पैसे पाठवले जात नाहीत.|आपका निर्णय यहाँ दर्ज होता है। हिसाब में दर्ज करने पर ही बाकी रकम और बँटवारा बदलता है। यह पहले दिए पैसों का रिकॉर्ड है; इससे पैसे नहीं भेजे जाते।
Edit draft|मसुदा बदला|ड्राफ्ट बदलें
Beneficiary distribution|पैसे घेणाऱ्यांना वाटप|पैसे पाने वालों में बँटवारा
Receipt funding|जमा नोंदीतून रक्कम|जमा रिकॉर्ड से रकम
Add claim row|बिलाची ओळ जोडा|बिल की पंक्ति जोड़ें
Add receipt row|जमा नोंदीची ओळ जोडा|जमा रिकॉर्ड की पंक्ति जोड़ें
Remove|काढा|हटाएँ
Choose a record to see its balance.|शिल्लक पाहण्यासाठी नोंद निवडा.|बाकी रकम देखने के लिए रिकॉर्ड चुनें।
Approve a claim and post a receipt before recording a funded payment.|देयक नोंदवण्यापूर्वी बिल मंजूर करा आणि जमा हिशोबात नोंदवा.|भुगतान दर्ज करने से पहले बिल मंज़ूर करें और जमा हिसाब में दर्ज करें।
Create a claim before recording an instalment.|हप्ता नोंदवण्यापूर्वी बिल नोंदवा.|किस्त दर्ज करने से पहले बिल बनाएँ।
Attach payment evidence|पैसे दिल्याचा पुरावा जोडा|भुगतान का सबूत जोड़ें
Attach invoice, wage sheet or bank proof. PDF, PNG or JPEG; maximum 2 MB each and five files.|बिल, मजुरीची यादी किंवा बँकेचा पुरावा जोडा. PDF, PNG किंवा JPEG; प्रत्येकी जास्तीत जास्त २ MB आणि ५ फाइल.|बिल, मज़दूरी सूची या बैंक का सबूत जोड़ें। PDF, PNG या JPEG; हर फ़ाइल अधिकतम २ MB, कुल ५ फ़ाइलें।
Instalment history|हप्त्यांचा इतिहास|किस्तों का इतिहास
Claim distributions|बिलांवर दिलेली रक्कम|बिलों पर दी गई रकम
Current allocated|सध्या वाटप केलेले|अभी बाँटी गई रकम
Current available|सध्या उपलब्ध|अभी उपलब्ध
Available|उपलब्ध|उपलब्ध
Available for allocation|वाटपासाठी उपलब्ध|बाँटने के लिए उपलब्ध
Paid|दिलेले पैसे|दिए गए पैसे
Pending|बाकी|बाकी
Net payable|द्यायची रक्कम|देने की रकम
Bank debit|बँकेतून गेलेले पैसे|बैंक से गए पैसे
Correction of|याची दुरुस्ती|इसका सुधार
Create corrected payment|दुरुस्त देयक तयार करा|सुधारा हुआ भुगतान बनाएँ
Confirm reversal|उलट नोंदीची खात्री करा|उलटी एंट्री की पुष्टि करें
Reversal date|उलट नोंदीची तारीख|उलटी एंट्री की तारीख
Bank reversal evidence reference|बँकेच्या उलट व्यवहाराच्या पुराव्याचा संदर्भ|बैंक की उलटी एंट्री के सबूत का संदर्भ
All linked payments must first be reversed.|आधी जोडलेल्या सर्व देयकांची उलट नोंद करा.|पहले जुड़े सभी भुगतानों की उलटी एंट्री करें।
. The original remains in history.|. मूळ नोंद इतिहासात राहील.|। मूल रिकॉर्ड इतिहास में रहेगा।
I confirm the {0} and checked its evidence (required)|मी {0} आणि त्याचा पुरावा तपासून खात्री करतो (आवश्यक)|मैंने {0} और उसका सबूत जाँच लिया है और पुष्टि करता हूँ (ज़रूरी)
Labour batch: one bank debit with a beneficiary distribution schedule|मजुरांचा गट: बँकेतून एक खर्च, प्रत्येकाला दिलेल्या रकमेची यादी|मज़दूरों का समूह: बैंक से एक खर्च, हर व्यक्ति को दी रकम की सूची
Labour batch: one bank debit, linked distribution schedule.|मजुरांचा गट: बँकेतून एक खर्च आणि जोडलेली वाटप यादी.|मज़दूरों का समूह: बैंक से एक खर्च और जुड़ी बँटवारे की सूची।
Bank movement|बँक व्यवहार|बैंक लेनदेन
Bank date|बँकेची तारीख|बैंक की तारीख
Opening balance|सुरुवातीची शिल्लक|शुरुआती बाकी रकम
Running balance|त्या वेळची शिल्लक|उस समय की बाकी रकम
Source|मूळ नोंद|मूल रिकॉर्ड
Open record|मूळ नोंद उघडा|मूल रिकॉर्ड खोलें
Filters|निवड|चुनाव
All dates|सर्व तारखा|सभी तारीखें
Indian financial year|भारतीय आर्थिक वर्ष|भारतीय वित्त वर्ष
Calendar month|महिना|महीना
Custom dates|तारखा निवडा|तारीखें चुनें
From|पासून|से
To|पर्यंत|तक
Financial-year start (YYYY)|आर्थिक वर्ष सुरू होणारे वर्ष (YYYY)|वित्त वर्ष शुरू होने का साल (YYYY)
Month|महिना|महीना
Period|कालावधी|समय
Search|शोधा|खोजें
All categories|सर्व प्रकार|सभी प्रकार
Minimum amount (INR)|किमान रक्कम (₹)|न्यूनतम रकम (₹)
Maximum amount (INR)|कमाल रक्कम (₹)|अधिकतम रकम (₹)
Previous|मागील|पिछला
Next|पुढील|अगला
0 records|० नोंदी|० रिकॉर्ड
{0}–{1} of {2} records|{2} पैकी {0}–{1} नोंदी|{2} में से {0}–{1} रिकॉर्ड
Adjust the filters or record and post your actual transactions.|निवड बदला किंवा तुमचे खरे व्यवहार हिशोबात नोंदवा.|चुनाव बदलें या अपने असली लेनदेन हिसाब में दर्ज करें।
Export Excel (.xlsx)|Excel फाइल डाउनलोड करा (.xlsx)|Excel फ़ाइल डाउनलोड करें (.xlsx)
Print / save PDF|छापा / PDF जतन करा|प्रिंट करें / PDF सेव करें
Exports include all filtered rows, not just this page. PDF uses your browser’s offline Save as PDF destination.|डाउनलोडमध्ये निवडलेल्या सर्व नोंदी येतात, फक्त या पानावरील नाही. PDF साठी ब्राउझरमधील इंटरनेटशिवाय PDF जतन करण्याचा पर्याय वापरा.|डाउनलोड में चुने सभी रिकॉर्ड आते हैं, केवल इस पेज के नहीं। PDF के लिए ब्राउज़र का बिना इंटरनेट PDF सेव करने का विकल्प चुनें।
Preparing local export…|फाइल तयार होत आहे…|फ़ाइल तैयार हो रही है…
Excel file prepared locally.|Excel फाइल या संगणकावर तयार झाली.|Excel फ़ाइल इस कंप्यूटर पर तैयार हो गई।
Export failed. Your records are unchanged.|फाइल तयार झाली नाही. तुमच्या नोंदी बदललेल्या नाहीत.|फ़ाइल नहीं बनी। आपके रिकॉर्ड नहीं बदले हैं।
Could not load the local Excel exporter. Try again.|Excel फाइल तयार करणारे साधन उघडले नाही. पुन्हा प्रयत्न करा.|Excel फ़ाइल बनाने वाला साधन नहीं खुला। फिर कोशिश करें।
Definitions|अर्थ आणि माहिती|अर्थ और जानकारी
Date basis|हिशोबासाठी वापरलेली तारीख|हिसाब में इस्तेमाल तारीख
Generated|तयार केले|तैयार किया
Generated {0}. {1}|तयार केले: {0}. {1}|तैयार किया: {0}। {1}
Find receipts, payments, claims and tax records. Exact Payment IDs appear first.|जमा, देयके, बिले आणि कराच्या नोंदी शोधा. पूर्ण पेमेंट क्रमांक जुळणाऱ्या नोंदी आधी दिसतात.|जमा, भुगतान, बिल और कर रिकॉर्ड खोजें। पूरा पेमेंट नंबर मिलने वाले रिकॉर्ड पहले दिखते हैं।
Chronological activity|तारखेनुसार घडामोडी|तारीख के क्रम में गतिविधि
Local workspace actions; up to 250 recent entries per linked record.|या संगणकावरील कृती; प्रत्येक जोडलेल्या नोंदीचे शेवटचे २५० बदल.|इस कंप्यूटर की कार्रवाइयाँ; हर जुड़े रिकॉर्ड के पिछले २५० बदलाव।
Linked outward payments|जोडलेली देयके|जुड़े भुगतान
Linked bank movements|जोडलेले बँक व्यवहार|जुड़े बैंक लेनदेन
From this receipt|या जमा नोंदीतून|इस जमा रिकॉर्ड से
Bank balances|बँकेतील शिल्लक|बैंक में बाकी रकम
Closing bank balance|अखेरची बँक शिल्लक|आखिरी बैंक बाकी रकम
Period cash breakdown|या काळातील पैशांचा तपशील|इस समय के पैसों का विवरण
Net values include reversals. Bar lengths show magnitude; signed values show direction.|रकमेत उलट नोंदी धरल्या आहेत. पट्टीची लांबी रक्कम दाखवते; अधिक-उणे चिन्ह दिशा दाखवते.|रकम में उलटी एंट्री शामिल हैं। पट्टी की लंबाई रकम दिखाती है; जोड़-घटाव का निशान दिशा दिखाता है।
Receipt funds and tax|जमा रक्कम आणि कर|जमा रकम और कर
Review pending claims|बाकी बिले तपासा|बाकी बिल जाँचें
Bank accounts are masked. Personal contact and identity fields are omitted.|बँक खाते क्रमांक लपवलेले आहेत. वैयक्तिक संपर्क आणि ओळख माहिती दाखवलेली नाही.|बैंक खाता नंबर छिपे हैं। निजी संपर्क और पहचान की जानकारी नहीं दिखाई गई है।
Bank accounts masked; personal contact and identity fields omitted|बँक खाते क्रमांक लपवलेले; वैयक्तिक संपर्क आणि ओळख माहिती वगळलेली|बैंक खाता नंबर छिपे; निजी संपर्क और पहचान की जानकारी हटाई गई
Bank: {0}. Period: {1} to {2}. Original file and mapped values will be retained locally.|बँक: {0}. कालावधी: {1} ते {2}. मूळ फाइल आणि जुळवलेली माहिती या संगणकावर राहील.|बैंक: {0}। समय: {1} से {2}। मूल फ़ाइल और मिलाई जानकारी इस कंप्यूटर पर रहेगी।
{0}, {1}. Cash uses bank movement dates.|{0}, {1}. पैशांचा हिशोब बँक व्यवहाराच्या तारखेनुसार आहे.|{0}, {1}। पैसों का हिसाब बैंक लेनदेन की तारीख से है।
Current pending approved claims across the selected Society: {0}. This claim total is not bank-specific. Statement lines with open exceptions: {1}.|निवडलेल्या संस्थेची सध्या मंजूर पण बाकी बिले: {0}. ही बेरीज एका बँकेपुरती नाही. अजून प्रश्न असलेल्या बँक ओळी: {1}.|चुनी संस्था के अभी मंज़ूर पर बाकी बिल: {0}। यह जोड़ किसी एक बैंक का नहीं है। जिन बैंक पंक्तियों पर सवाल बाकी हैं: {1}।
Keep a verified copy before closing your books.|काम संपवण्यापूर्वी तपासलेली बॅकअप प्रत ठेवा.|काम खत्म करने से पहले जाँची हुई बैकअप कॉपी रखें।
Latest local backup|शेवटचा बॅकअप|आखिरी बैकअप
Create your first backup|पहिला बॅकअप तयार करा|पहला बैकअप बनाएँ
Create verified backup|तपासलेला बॅकअप तयार करा|जाँचा हुआ बैकअप बनाएँ
No completed backup is recorded in this workspace’s backup folder.|या कामाच्या बॅकअप फोल्डरमध्ये पूर्ण झालेला बॅकअप नाही.|इस काम के बैकअप फ़ोल्डर में पूरा हुआ बैकअप नहीं है।
Automatic backups run when FundTrace starts and once a day while it is open. Keep a separate copy on an external drive to protect against computer loss.|FundTrace सुरू केल्यावर आणि चालू असताना दिवसातून एकदा बॅकअप होतो. संगणक हरवला किंवा बिघडला तर उपयोगासाठी बाहेरच्या ड्राइव्हवरही प्रत ठेवा.|FundTrace चालू करने पर और खुले रहने पर रोज़ एक बार बैकअप होता है। कंप्यूटर खोने या खराब होने से बचाव के लिए बाहरी ड्राइव पर भी कॉपी रखें।
I understand that backup folders include private records and their encryption key.|बॅकअप फोल्डरमध्ये खाजगी नोंदी आणि त्या उघडण्यासाठी लागणारी किल्ली असते, हे मला समजले आहे.|मैं समझता हूँ कि बैकअप फ़ोल्डर में निजी रिकॉर्ड और उन्हें खोलने की कुंजी होती है।
Where your records are stored|तुमच्या नोंदी कुठे ठेवल्या आहेत|आपके रिकॉर्ड कहाँ रखे हैं
Active workspace|सध्या वापरलेला माहितीचा फोल्डर|अभी इस्तेमाल हो रहा जानकारी का फ़ोल्डर
Local backup folder|या संगणकावरील बॅकअप फोल्डर|इस कंप्यूटर का बैकअप फ़ोल्डर
Copy one dated backup folder, including all three files. Checksums detect damage; they do not prove who created a backup. Use only your trusted backups.|तारीख असलेला एक बॅकअप फोल्डर त्यातील तिन्ही फाइलसह कॉपी करा. तपासणीमुळे फाइल बिघडली आहे का ते कळते, बॅकअप कोणी केला ते नाही. फक्त विश्वासू बॅकअप वापरा.|तारीख वाला एक बैकअप फ़ोल्डर उसकी तीनों फ़ाइलों सहित कॉपी करें। जाँच से फ़ाइल खराब होने का पता चलता है, बनाने वाले का नहीं। केवल भरोसेमंद बैकअप इस्तेमाल करें।
Backups are retained until you remove them. Review disk space monthly and keep at least two verified copies on separate drives.|तुम्ही काढेपर्यंत बॅकअप राहतात. दर महिन्याला मोकळी जागा तपासा आणि वेगळ्या ड्राइव्हवर किमान दोन तपासलेल्या प्रती ठेवा.|बैकअप आपके हटाने तक रहते हैं। हर महीने खाली जगह जाँचें और अलग ड्राइव पर कम से कम दो जाँची हुई कॉपियाँ रखें।
Restore a saved workspace|जतन केलेली माहिती परत आणा|सेव जानकारी वापस लाएँ
Close FundTrace with Ctrl+C in its launcher window.|FundTrace सुरू केलेल्या विंडोमध्ये Ctrl+C दाबून बंद करा.|FundTrace चालू की गई विंडो में Ctrl+C दबाकर बंद करें।
Paste the dated backup folder path. Review its date and the destination, then type RESTORE.|तारीख असलेल्या बॅकअप फोल्डरचा पत्ता पेस्ट करा. तारीख आणि माहिती कुठे जाईल ते तपासून RESTORE लिहा.|तारीख वाले बैकअप फ़ोल्डर का पता पेस्ट करें। तारीख और जानकारी कहाँ जाएगी यह जाँचकर RESTORE लिखें।
Start FundTrace and check recent records, balances and attachments.|FundTrace सुरू करून अलीकडील नोंदी, शिल्लक आणि जोडलेल्या फाइल तपासा.|FundTrace चालू करके हाल के रिकॉर्ड, बाकी रकम और जुड़ी फ़ाइलें जाँचें।
Restore validates the database and key before replacing anything. Your previous data folder is retained beside the active workspace. Changes made after the backup will not appear in the restored workspace.|माहिती बदलण्यापूर्वी तिची आणि किल्लीची तपासणी होते. आधीचा माहितीचा फोल्डर बाजूला ठेवला जातो. बॅकअपनंतरचे बदल परत आणलेल्या माहितीत दिसणार नाहीत.|जानकारी बदलने से पहले उसकी और कुंजी की जाँच होती है। पुराना जानकारी फ़ोल्डर अलग रखा जाता है। बैकअप के बाद के बदलाव वापस लाई जानकारी में नहीं दिखेंगे।
After a power cut or unexpected shutdown|वीज गेल्यावर किंवा अचानक बंद झाल्यावर|बिजली जाने या अचानक बंद होने पर
If the workspace stays locked after its process has stopped, open|काम बंद असूनही लॉक राहिल्यास उघडा:|काम बंद होने पर भी लॉक रहे तो खोलें:
, then start again. The tool refuses to unlock a running process.|, मग पुन्हा सुरू करा. चालू असलेले काम हे साधन अनलॉक करत नाही.|, फिर दोबारा चालू करें। यह साधन चल रहे काम का लॉक नहीं खोलता।
Saved local backups|जतन केलेले बॅकअप|सेव बैकअप
Created (IST)|तयार केल्याची वेळ (भारतीय वेळ)|बनाने का समय (भारतीय समय)
Folder|फोल्डर|फ़ोल्डर
Database size|माहितीचा आकार|जानकारी का आकार
No backups yet.|अजून बॅकअप नाही.|अभी कोई बैकअप नहीं है।
Backup verified and saved: {0}. Copy this entire folder to your external drive.|बॅकअप तपासून जतन केला: {0}. हा पूर्ण फोल्डर बाहेरच्या ड्राइव्हवर कॉपी करा.|बैकअप जाँचकर सेव किया: {0}। यह पूरा फ़ोल्डर बाहरी ड्राइव पर कॉपी करें।
({0} KB)|({0} KB)|({0} KB)
{0} MB|{0} MB|{0} MB
FundTrace — {0}|FundTrace — {0}|FundTrace — {0}
Import bank statement|बँक स्टेटमेंट जोडा|बैंक स्टेटमेंट जोड़ें
Import statement|स्टेटमेंट जोडा|स्टेटमेंट जोड़ें
Import reviewed statement|तपासलेले स्टेटमेंट जतन करा|जाँचा स्टेटमेंट सेव करें
Import statement evidence and match it to posted bank-book movements.|बँक स्टेटमेंटचा पुरावा जोडा आणि हिशोबातील व्यवहारांशी जुळवा.|बैंक स्टेटमेंट का सबूत जोड़ें और हिसाब के लेनदेन से मिलाएँ।
Read a local CSV or Excel file, map its columns, preview and confirm. Imports do not create bank cash.|या संगणकावरील CSV किंवा Excel फाइल वाचा, रकाने जुळवा, तपासा आणि खात्री करा. फाइल जोडल्याने बँक शिल्लक वाढत नाही.|इस कंप्यूटर की CSV या Excel फ़ाइल पढ़ें, कॉलम मिलाएँ, जाँचें और पुष्टि करें। फ़ाइल जोड़ने से बैंक की बाकी रकम नहीं बढ़ती।
Statement file|स्टेटमेंट फाइल|स्टेटमेंट फ़ाइल
Statement start|स्टेटमेंट सुरू होण्याची तारीख|स्टेटमेंट की शुरू तारीख
Statement end|स्टेटमेंट संपण्याची तारीख|स्टेटमेंट की आखिरी तारीख
Statement opening balance (INR)|स्टेटमेंटची सुरुवातीची शिल्लक (₹)|स्टेटमेंट की शुरुआती बाकी रकम (₹)
Statement closing balance (INR)|स्टेटमेंटची अखेरची शिल्लक (₹)|स्टेटमेंट की आखिरी बाकी रकम (₹)
Text date format|लिहिलेल्या तारखेचा नमुना|लिखी तारीख का प्रारूप
Or enter statement rows as CSV|किंवा स्टेटमेंटच्या ओळी CSV म्हणून भरा|या स्टेटमेंट की पंक्तियाँ CSV में भरें
Read statement|स्टेटमेंट वाचा|स्टेटमेंट पढ़ें
Read the statement before previewing.|पाहणीपूर्वी स्टेटमेंट वाचा.|पहले स्टेटमेंट पढ़ें, फिर जाँचें।
Choose a file or enter CSV rows.|फाइल निवडा किंवा CSV ओळी भरा.|फ़ाइल चुनें या CSV पंक्तियाँ भरें।
Column mapping|रकाने जुळवणे|कॉलम का मिलान
Worksheet|शीट|शीट
To be mapped|अजून निवडलेले नाही|अभी चुना नहीं है
Preview import|जोडण्यापूर्वी तपासा|जोड़ने से पहले जाँचें
Review {0} statement rows|स्टेटमेंटच्या {0} ओळी तपासा|स्टेटमेंट की {0} पंक्तियाँ जाँचें
{0} rows read. A debit and credit column must be mapped; unused row values may be blank.|{0} ओळी वाचल्या. खर्च आणि जमा रकाने जुळवा; वापरात नसलेली माहिती रिकामी ठेवू शकता.|{0} पंक्तियाँ पढ़ीं। खर्च और जमा कॉलम मिलाएँ; इस्तेमाल न होने वाली जानकारी खाली रह सकती है।
Opening {0}, closing {1}. Duplicate rows: {2}. Showing the first 20 rows.|सुरुवात {0}, अखेर {1}. सारख्या ओळी: {2}. पहिल्या २० ओळी दाखवल्या आहेत.|शुरुआत {0}, आखिर {1}। एक जैसी पंक्तियाँ: {2}। पहली २० पंक्तियाँ दिखाई गई हैं।
This period overlaps an existing statement for this bank. Choose a separate consecutive period; this import cannot be saved.|या काळाचे स्टेटमेंट आधीच आहे. वेगळा सलग कालावधी निवडा; ही फाइल जतन करता येणार नाही.|इस समय का स्टेटमेंट पहले से है। अलग लगातार समय चुनें; यह फ़ाइल सेव नहीं हो सकती।
I checked the evidence and confirm this local action|मी पुरावा तपासला असून या कृतीची खात्री करतो|मैंने सबूत जाँचा है और इस कार्रवाई की पुष्टि करता हूँ
Open statement|स्टेटमेंट उघडा|स्टेटमेंट खोलें
Download original evidence|मूळ पुरावा डाउनलोड करा|मूल सबूत डाउनलोड करें
Opening {0}, closing {1}. {2} of {3} lines matched.|सुरुवात {0}, अखेर {1}. {3} पैकी {2} ओळी जुळल्या.|शुरुआत {0}, आखिर {1}। {3} में से {2} पंक्तियाँ मिलीं।
Review line|ओळ तपासा|पंक्ति जाँचें
Remaining to match|अजून जुळवायची रक्कम|अभी मिलाने की रकम
Remaining {0}|बाकी {0}|बाकी {0}
Matched|जुळलेले|मिलान हुआ
Unmatched|न जुळलेले|मिलान नहीं हुआ
Partially matched|काही रक्कम जुळलेली|कुछ रकम का मिलान हुआ
Exception|तपासायचा प्रश्न|जाँचने का सवाल
Exceptions|तपासायचे प्रश्न|जाँचने के सवाल
Not posted|हिशोबात नोंद नाही|हिसाब में दर्ज नहीं
All reconciliation states|जुळवणीच्या सर्व स्थिती|मिलान की सभी स्थितियाँ
Reconciliation|हिशोब जुळवणी|हिसाब का मिलान
Candidates are ordered by reference and amount. Review the actual dates and evidence before confirming. Different dates or references require a reason.|संदर्भ आणि रकमेनुसार शक्य नोंदी दाखवल्या आहेत. खात्री करण्यापूर्वी तारखा आणि पुरावे तपासा. तारीख किंवा संदर्भ वेगळा असल्यास कारण द्या.|संदर्भ और रकम के अनुसार संभावित रिकॉर्ड दिखाए हैं। पुष्टि से पहले तारीख और सबूत जाँचें। तारीख या संदर्भ अलग हो तो कारण दें।
Select movement|व्यवहार निवडा|लेनदेन चुनें
Match amount (INR)|जुळवायची रक्कम (₹)|मिलाने की रकम (₹)
Add movement|व्यवहार जोडा|लेनदेन जोड़ें
Remove row|ओळ काढा|पंक्ति हटाएँ
Reason for date/reference difference|तारीख / संदर्भ वेगळा असण्याचे कारण|तारीख / संदर्भ अलग होने का कारण
Confirm matches|जुळवणीची खात्री करा|मिलान की पुष्टि करें
Remove match|जुळवणी काढा|मिलान हटाएँ
Confirm removal|काढण्याची खात्री करा|हटाने की पुष्टि करें
New exception|नवा प्रश्न नोंदवा|नया सवाल दर्ज करें
Follow-up owner annotation|पाठपुरावा करणाऱ्याचे नाव (फक्त नोंद)|पूछताछ करने वाले का नाम (केवल नोट)
Owner annotation|जबाबदार व्यक्तीचे नाव (फक्त नोंद)|ज़िम्मेदार व्यक्ति का नाम (केवल नोट)
Owner names are annotations, not authenticated accounts. Resolving an exception does not match its remaining amount.|नाव ही फक्त टिप आहे; पडताळलेले खाते नाही. प्रश्न सोडवला तरी बाकी रकमेची जुळवणी आपोआप होत नाही.|नाम केवल नोट है; जाँचा हुआ खाता नहीं। सवाल सुलझाने से बाकी रकम का मिलान अपने आप नहीं होता।
Save exception|प्रश्नाची नोंद जतन करा|सवाल का रिकॉर्ड सेव करें
Resolved|सोडवलेले|सुलझा हुआ
Age|किती दिवस झाले|कितने दिन हुए
Outcome|निकाल|नतीजा
Record bank movement|बँक व्यवहार नोंदवा|बैंक लेनदेन दर्ज करें
Record evidenced bank charges, interest and other movements without inventing receipt funds.|पुराव्यासह बँक शुल्क, व्याज आणि इतर व्यवहार नोंदवा. यात जमा नोंदीची वाटप रक्कम तयार होत नाही.|सबूत के साथ बैंक शुल्क, ब्याज और अन्य लेनदेन दर्ज करें। इससे जमा रिकॉर्ड की बाँटने योग्य रकम नहीं बनती।
Bank charge|बँक शुल्क|बैंक शुल्क
Interest|व्याज|ब्याज
Other credit|इतर जमा|अन्य जमा
Other debit|इतर खर्च|अन्य खर्च
Post bank movement|बँक व्यवहार हिशोबात नोंदवा|बैंक लेनदेन हिसाब में दर्ज करें
Charges and other movements change the bank book but never create receipt funding.|शुल्क आणि इतर व्यवहार बँकेचा हिशोब बदलतात; जमा नोंदीची वाटप रक्कम वाढवत नाहीत.|शुल्क और अन्य लेनदेन बैंक का हिसाब बदलते हैं; जमा रिकॉर्ड की बाँटने योग्य रकम नहीं बढ़ाते।
Reverse adjustment|व्यवहाराची उलट नोंद करा|लेनदेन की उलटी एंट्री करें
Reverse bank adjustment|बँक व्यवहाराची उलट नोंद करा|बैंक लेनदेन की उलटी एंट्री करें
Reversal reason|उलट नोंदीचे कारण|उलटी एंट्री का कारण
Retained in history|इतिहासात ठेवलेले|इतिहास में रखा गया
Lock reconciled period|जुळवलेला कालावधी लॉक करा|मिलान किए समय को लॉक करें
Lock only fully matched periods whose statement opening and closing agree with the bank book.|सर्व व्यवहार जुळलेले आणि सुरुवातीची व अखेरची शिल्लक बँक हिशोबाशी जुळणारे कालावधीच लॉक करा.|केवल वही समय लॉक करें जिसके सभी लेनदेन और शुरू व आखिर की बाकी रकम बैंक हिसाब से मिलते हों।
Period start|कालावधीची सुरुवात|समय की शुरुआत
Period end|कालावधीचा शेवट|समय का अंत
Locked|लॉक केलेले|लॉक किया गया
Reopen|पुन्हा उघडा|फिर खोलें
Confirm reopening|पुन्हा उघडण्याची खात्री करा|फिर खोलने की पुष्टि करें
A lock also protects earlier balances and historical tax records for this Society. Reopen later periods first when a correction is required.|लॉकमुळे संस्थेची आधीची शिल्लक आणि कराच्या जुन्या नोंदीही सुरक्षित राहतात. दुरुस्तीसाठी नंतरचे कालावधी आधी उघडा.|लॉक से संस्था की पुरानी बाकी रकम और कर रिकॉर्ड भी सुरक्षित रहते हैं। सुधार के लिए बाद वाले समय पहले खोलें।
Tax deductions, credits and set-off are separate from bank cash and receipt funding.|कर कपात, कर जमा आणि कराचा वापर बँकेतील पैसे व जमा वाटपापेक्षा वेगळे आहेत.|कर कटौती, कर क्रेडिट और उसका उपयोग बैंक के पैसों व जमा बँटवारे से अलग हैं।
Expected, deducted, credited and set-off amounts are shown separately. None changes bank cash.|अपेक्षित, कापलेला, जमा आणि वापरलेला कर वेगळा दाखवला आहे. यातून बँकेची रोख शिल्लक बदलत नाही.|अनुमानित, काटा गया, जमा और इस्तेमाल कर अलग दिखाए हैं। इनसे बैंक की नकद बाकी रकम नहीं बदलती।
Tax credit is not cash and cannot fund a payment.|कर जमा ही रोख रक्कम नाही. त्यातून देयक देता येत नाही.|कर क्रेडिट नकद रकम नहीं है। उससे भुगतान नहीं हो सकता।
Configure tax treatments|कराचे नियम ठरवा|कर के नियम तय करें
Configure only accountant-confirmed rates and bases. No rate, including 2%, is assumed.|फक्त लेखापालाने खात्री केलेले दर आणि आधार भरा. २% सह कोणताही दर आपोआप धरलेला नाही.|केवल लेखाकार से पक्के किए दर और आधार भरें। २% सहित कोई दर अपने आप नहीं माना गया है।
Tax treatment name|कर नियमाचे नाव|कर नियम का नाम
Confirmed rate (%)|खात्री केलेला दर (%)|पक्का किया गया दर (%)
Calculation basis|कर मोजण्याचा आधार|कर गणना का आधार
Accountant confirmation / evidence reference|लेखापालाची खात्री / पुराव्याचा संदर्भ|लेखाकार की पुष्टि / सबूत का संदर्भ
Save tax treatment|कराचा नियम जतन करा|कर का नियम सेव करें
Versions are immutable. A later effective date supersedes an earlier version without rewriting existing tax records.|जुने नियम बदलत नाहीत. नवीन तारखेचा नियम पुढे लागू होतो; जुन्या कर नोंदी बदलत नाहीत.|पुराने नियम नहीं बदलते। नई तारीख का नियम आगे लागू होता है; पुराने कर रिकॉर्ड नहीं बदलते।
New tax record|नवी कर नोंद|नया कर रिकॉर्ड
Create tax record|कर नोंद तयार करा|कर रिकॉर्ड बनाएँ
Tax date|कराची तारीख|कर की तारीख
Tax treatment (required)|कराचा नियम (आवश्यक)|कर का नियम (ज़रूरी)
Select treatment|कराचा नियम निवडा|कर का नियम चुनें
Linked receipt|जोडलेली जमा नोंद|जुड़ा जमा रिकॉर्ड
No receipt link|जमा नोंद जोडलेली नाही|जमा रिकॉर्ड नहीं जुड़ा
Tax base (INR)|ज्या रकमेवर कर मोजायचा (₹)|जिस रकम पर कर गिनना है (₹)
Deducted from bill (INR)|बिलातून कापलेली रक्कम (₹)|बिल से काटी गई रकम (₹)
Expected tax override (INR), optional|वेगळा अपेक्षित कर (₹), गरज असेल तर|अलग अनुमानित कर (₹), ज़रूरत हो तो
Override reason (required when expected differs)|अपेक्षित कर वेगळा असल्याचे कारण (आवश्यक)|अनुमानित कर अलग होने का कारण (ज़रूरी)
Certificate / tax ledger reference|प्रमाणपत्र / कर नोंदवहीचा संदर्भ|प्रमाणपत्र / कर रजिस्टर का संदर्भ
Initial status|सुरुवातीची स्थिती|शुरुआती स्थिति
Linked bank amount annotation (INR)|जोडलेल्या बँक रकमेची टिप (₹)|जुड़ी बैंक रकम का नोट (₹)
Bank evidence reference|बँक पुराव्याचा संदर्भ|बैंक सबूत का संदर्भ
Supporting document (required)|पुराव्याची फाइल (आवश्यक)|सबूत की फ़ाइल (ज़रूरी)
Leave the expected override empty to calculate base × the selected rate, rounded half-up to one paise. Bank annotations never create cash; link the actual receipt if recording one.|कर आपोआप मोजण्यासाठी वेगळ्या कराची जागा रिकामी ठेवा. आधार रक्कम × दर मोजून जवळच्या पैशापर्यंत रक्कम ठरते. बँकेची टिप रोख रक्कम वाढवत नाही; खरी जमा नोंद असेल तर जोडा.|कर अपने आप गिनने के लिए अलग कर की जगह खाली रखें। आधार रकम × दर से नज़दीकी पैसे तक रकम तय होती है। बैंक का नोट नकद नहीं बढ़ाता; असली जमा रिकॉर्ड हो तो जोड़ें।
Expected|अपेक्षित|अनुमानित
Deducted|कापलेले|काटा गया
Credit Pending|जमा होणे बाकी|जमा होना बाकी
Credited|जमा झालेले|जमा हुआ
Partly Set Off|काही कर वापरलेला|कुछ कर इस्तेमाल हुआ
Fully Set Off|पूर्ण कर वापरलेला|पूरा कर इस्तेमाल हुआ
Disputed|वाद असलेले|विवाद वाला
Tax events|कराचे बदल|कर के बदलाव
Record tax event|करातील बदल नोंदवा|कर का बदलाव दर्ज करें
Event type|बदलाचा प्रकार|बदलाव का प्रकार
Event date|बदलाची तारीख|बदलाव की तारीख
Event evidence reference|बदलाच्या पुराव्याचा संदर्भ|बदलाव के सबूत का संदर्भ
Status for status event|स्थिती बदलासाठी नवी स्थिती|स्थिति बदलाव के लिए नई स्थिति
Set-off|करातून वजा केलेले|कर से घटाया गया
Set off|करातून वजा करा|कर से घटाएँ
Adjustment increase|रक्कम वाढवणारी दुरुस्ती|रकम बढ़ाने वाला सुधार
Adjustment decrease|रक्कम कमी करणारी दुरुस्ती|रकम घटाने वाला सुधार
Events are append-only. Set-off and decreases cannot exceed available credit. A status event records no amount.|जुन्या नोंदी बदलत नाहीत; नवीन बदल जोडले जातात. वजा किंवा कमी केलेली रक्कम उपलब्ध कर जमापेक्षा जास्त नसावी. फक्त स्थिती बदलल्यास रक्कम नोंदवत नाही.|पुराने रिकॉर्ड नहीं बदलते; नए बदलाव जुड़ते हैं। घटाई रकम उपलब्ध कर क्रेडिट से अधिक नहीं हो सकती। केवल स्थिति बदलने पर रकम दर्ज नहीं होती।
Search tax records|कराच्या नोंदी शोधा|कर रिकॉर्ड खोजें
Tax base|कराचा आधार|कर का आधार
Tax ID|कर क्रमांक|कर नंबर
Tax evidence|कराचा पुरावा|कर का सबूत
Treatment|कराचा नियम|कर का नियम
Basis|आधार|आधार
Rate|दर|दर
Calculated|मोजलेले|गिना गया
Bank annotation only|फक्त बँकेबद्दल टिप|केवल बैंक का नोट
Available tax credit|उपलब्ध कर जमा|उपलब्ध कर क्रेडिट
Available tax (not cash)|उपलब्ध कर जमा (रोख नाही)|उपलब्ध कर क्रेडिट (नकद नहीं)
Separate positions / totals|वेगळी स्थिती / बेरीज|अलग स्थिति / जोड़
Separate receipt / tax positions|जमा आणि कराची वेगळी स्थिती|जमा और कर की अलग स्थिति
Only active posted instalments reduce the pending amount.|फक्त हिशोबात नोंद असलेले चालू हप्ते बाकी रक्कम कमी करतात.|केवल हिसाब में दर्ज चालू किस्तें बाकी रकम घटाती हैं।
Only active posted payments consume funding. This schedule remains in history.|फक्त हिशोबात नोंद असलेली चालू देयके वाटप वापरतात. ही यादी इतिहासात राहते.|केवल हिसाब में दर्ज चालू भुगतान रकम इस्तेमाल करते हैं। यह सूची इतिहास में रहती है।
Only approved claims and posted receipts in this project are eligible. Funding must use the paying bank account. Drafts do not reserve funds; posting rechecks every balance.|याच कामाची मंजूर बिले आणि हिशोबातील जमा वापरा. पैसे देणाऱ्या बँक खात्यातीलच जमा वापरा. मसुदा पैसे राखून ठेवत नाही; नोंद करताना सर्व शिल्लक पुन्हा तपासली जाते.|इसी काम के मंज़ूर बिल और हिसाब की जमा इस्तेमाल करें। पैसे देने वाले बैंक खाते की ही जमा लें। ड्राफ्ट रकम रोकता नहीं; दर्ज करते समय सारी बाकी रकम फिर जाँची जाती है।
Only draft records can be edited.|फक्त मसुद्यातील नोंदी बदलता येतात.|केवल ड्राफ्ट रिकॉर्ड बदले जा सकते हैं।
Only the credited amount creates cash. Gross bill, GST deduction and tax credit are reference information and never increase the bank balance.|फक्त खरोखर जमा झालेली रक्कम शिल्लक वाढवते. पूर्ण बिल, GST कपात आणि कर जमा ही संदर्भाची माहिती आहे; ती बँक शिल्लक वाढवत नाही.|केवल सच में जमा रकम बाकी रकम बढ़ाती है। पूरा बिल, GST कटौती और कर क्रेडिट संदर्भ की जानकारी हैं; वे बैंक की बाकी रकम नहीं बढ़ाते।
Net payable = gross − TDS − retention − other deductions. GST is already included in gross; it is not added again. Supplier claims need an invoice date; work and labour claims need certification. Individual labour claims also need days and rate.|द्यायची रक्कम = पूर्ण बिल − TDS − राखलेली रक्कम − इतर कपात. GST आधीच बिलात आहे; पुन्हा जोडत नाही. पुरवठादाराच्या बिलाला तारीख, काम व मजुरीच्या बिलाला तपासणीचा पुरावा लागतो. वैयक्तिक मजुरीसाठी दिवस आणि दरही भरा.|देने की रकम = पूरा बिल − TDS − रोकी रकम − अन्य कटौती। GST पहले से बिल में है; फिर नहीं जुड़ता। सामान के बिल में तारीख और काम व मज़दूरी के बिल में जाँच का सबूत चाहिए। व्यक्तिगत मज़दूरी में दिन और दर भी भरें।
Record one bank debit and distribute it across claims. Allocate the full debit to receipts.|बँकेतून गेलेली एक रक्कम बिलांवर वाटा. पूर्ण रक्कम जमा नोंदींमधून जोडा.|बैंक से गई एक रकम बिलों में बाँटें। पूरी रकम जमा रिकॉर्ड से जोड़ें।
Record supplier payments and labour batches with traceable receipt funding.|पुरवठादार आणि मजुरांना दिलेले पैसे मूळ जमा नोंदींशी जोडून नोंदवा.|सामान देने वालों और मज़दूरों को दिए पैसे मूल जमा रिकॉर्ड से जोड़कर दर्ज करें।
Track approved claims, part payments and the remaining payable amount.|मंजूर बिले, दिलेले हप्ते आणि बाकी रक्कम पाहा.|मंज़ूर बिल, दी गई किस्तें और बाकी रकम देखें।
Record bank credits, retain evidence and trace every posted rupee.|बँकेतील जमा नोंदवा, पुरावे ठेवा आणि प्रत्येक नोंदवलेल्या रुपयाचा हिशोब पाहा.|बैंक की जमा दर्ज करें, सबूत रखें और हर दर्ज रुपये का हिसाब देखें।
Record Government receipt|सरकारकडून आलेली रक्कम नोंदवा|सरकार से मिली रकम दर्ज करें
Save incomplete details as a draft. Map the project and attach bank evidence before posting.|अपूर्ण माहिती मसुदा म्हणून ठेवा. हिशोबात नोंद करण्यापूर्वी काम निवडा आणि बँकेचा पुरावा जोडा.|अधूरी जानकारी ड्राफ्ट में रखें। हिसाब में दर्ज करने से पहले काम चुनें और बैंक का सबूत जोड़ें।
Posting assigns an immutable Payment ID using the credit date’s financial year and updates the bank book once. Check the amount, dates and evidence carefully.|नोंद केल्यावर जमा तारखेच्या आर्थिक वर्षानुसार न बदलणारा पेमेंट क्रमांक मिळतो आणि बँक हिशोब एकदा बदलतो. रक्कम, तारखा आणि पुरावा नीट तपासा.|दर्ज करने पर जमा तारीख के वित्त वर्ष से स्थायी पेमेंट नंबर मिलता है और बैंक हिसाब एक बार बदलता है। रकम, तारीख और सबूत ध्यान से जाँचें।
Post confirmed receipt|तपासलेली जमा हिशोबात नोंदवा|जाँची जमा हिसाब में दर्ज करें
Post confirmed bank debit|तपासलेला खर्च हिशोबात नोंदवा|जाँचा खर्च हिसाब में दर्ज करें
Posted receipts are locked. Use a reasoned reversal to correct them.|हिशोबातील जमा नोंदी लॉक आहेत. दुरुस्तीसाठी कारण देऊन उलट नोंद करा.|हिसाब की जमा एंट्री लॉक हैं। सुधार के लिए कारण देकर उलटी एंट्री करें।
Posted receipts cannot be edited.|हिशोबातील जमा नोंदी बदलता येत नाहीत.|हिसाब की जमा एंट्री बदली नहीं जा सकतीं।
Possible duplicate bank credit|ही जमा आधी नोंदवलेली असू शकते|यह जमा पहले से दर्ज हो सकती है
Review and confirm|तपासा आणि खात्री करा|जाँचें और पुष्टि करें
Review and post|तपासा आणि हिशोबात नोंदवा|जाँचें और हिसाब में दर्ज करें
This receipt is reversed. Its Payment ID, original bank credit and reversal remain in history.|या जमा नोंदीची उलट नोंद झाली आहे. पेमेंट क्रमांक, मूळ जमा आणि उलट नोंद इतिहासात आहेत.|इस जमा की उलटी एंट्री हो गई है। पेमेंट नंबर, मूल जमा और उलटी एंट्री इतिहास में हैं।
Original bank credit|मूळ बँक जमा|मूल बैंक जमा
These allocations reduce receipt availability.|या वाटपामुळे जमा नोंदीतील उपलब्ध रक्कम कमी होते.|इस बँटवारे से जमा रिकॉर्ड की उपलब्ध रकम घटती है।
Receipt allocations|जमा रकमेतून वाटप|जमा रकम का बँटवारा
Receipt utilisation|जमा रकमेचा वापर|जमा रकम का उपयोग
Receipt activity|जमा नोंदीच्या घडामोडी|जमा रिकॉर्ड की गतिविधि
Receipt draft|जमा नोंदीचा मसुदा|जमा रिकॉर्ड का ड्राफ्ट
Receipt evidence|जमा रकमेचा पुरावा|जमा का सबूत
Payment draft|देयकाचा मसुदा|भुगतान का ड्राफ्ट
Payment date|देयकाची तारीख|भुगतान की तारीख
Payment evidence|देयकाचा पुरावा|भुगतान का सबूत
Payment evidence file (required)|देयकाच्या पुराव्याची फाइल (आवश्यक)|भुगतान के सबूत की फ़ाइल (ज़रूरी)
Evidence file (required)|पुराव्याची फाइल (आवश्यक)|सबूत की फ़ाइल (ज़रूरी)
PDF, PNG or JPEG, up to 2 MB. Stored locally.|PDF, PNG किंवा JPEG, जास्तीत जास्त २ MB. याच संगणकावर ठेवले जाते.|PDF, PNG या JPEG, अधिकतम २ MB। इसी कंप्यूटर पर रखा जाता है।
PDF, PNG or JPEG. Up to 2 MB each, maximum five files. Stored encrypted on this computer.|PDF, PNG किंवा JPEG. प्रत्येकी २ MB पर्यंत, जास्तीत जास्त ५ फाइल. या संगणकावर सुरक्षित स्वरूपात ठेवल्या जातात.|PDF, PNG या JPEG। हर फ़ाइल २ MB तक, कुल ५ फ़ाइलें। इस कंप्यूटर पर सुरक्षित रूप में रखी जाती हैं।
No evidence attached yet.|अजून पुरावा जोडलेला नाही.|अभी सबूत नहीं जुड़ा है।
No evidence attached.|पुरावा जोडलेला नाही.|सबूत नहीं जुड़ा है।
No posted instalments yet.|अजून हिशोबात हप्ता नोंदलेला नाही.|अभी हिसाब में कोई किस्त दर्ज नहीं है।
No posted payment allocations yet.|अजून देयकाचे वाटप नोंदलेले नाही.|अभी भुगतान का बँटवारा दर्ज नहीं है।
No posted movements for this account.|या खात्यात अजून व्यवहार नोंदलेला नाही.|इस खाते में अभी कोई लेनदेन दर्ज नहीं है।
No bank accounts yet|अजून बँक खाते नाही|अभी कोई बैंक खाता नहीं
No matching receipts|जुळणाऱ्या जमा नोंदी नाहीत|मिलती जमा एंट्री नहीं हैं
No records yet|अजून नोंदी नाहीत|अभी रिकॉर्ड नहीं हैं
No matching {0}|जुळणारे {0} नाहीत|मिलते हुए {0} नहीं हैं
Use the action above to start with your actual records.|तुमच्या खऱ्या नोंदी सुरू करण्यासाठी वरील बटण वापरा.|अपने असली रिकॉर्ड शुरू करने के लिए ऊपर का बटन इस्तेमाल करें।
Record a bank credit or change the filters. Drafts never increase cash balances.|जमा नोंदवा किंवा निवड बदला. मसुद्यामुळे रोख शिल्लक वाढत नाही.|जमा दर्ज करें या चुनाव बदलें। ड्राफ्ट से नकद बाकी रकम नहीं बढ़ती।
Register a bank account|बँक खाते जोडा|बैंक खाता जोड़ें
Register a bank account with its opening balance to begin.|सुरुवात करण्यासाठी बँक खाते आणि सुरुवातीची शिल्लक भरा.|शुरू करने के लिए बैंक खाता और शुरुआती बाकी रकम भरें।
Opening / initial bank balance|सुरुवातीची बँक शिल्लक|शुरुआती बैंक बाकी रकम
Opening bank balance (INR)|सुरुवातीची बँक शिल्लक (₹)|शुरुआती बैंक बाकी रकम (₹)
Opening balances plus posted credits, less posted payments, with linked reversals. Drafts and tax credits are excluded.|सुरुवातीची शिल्लक + नोंदवलेली जमा − दिलेले पैसे, आणि उलट नोंदी. मसुदे आणि कर जमा यात धरलेले नाहीत.|शुरुआती बाकी रकम + दर्ज जमा − दिए पैसे, और उलटी एंट्री। ड्राफ्ट और कर क्रेडिट शामिल नहीं हैं।
Opening balance {0} on {1}, {2}|{1} रोजी सुरुवातीची शिल्लक {0}, {2}|{1} को शुरुआती बाकी रकम {0}, {2}
Other bank movement|इतर बँक व्यवहार|अन्य बैंक लेनदेन
Movement|व्यवहार|लेनदेन
Signed bank movement|अधिक-उणे चिन्हासह बँक व्यवहार|जोड़-घटाव के निशान सहित बैंक लेनदेन
Period bank credits|या काळातील बँक जमा|इस समय की बैंक जमा
Period bank debits|या काळातील बँक खर्च|इस समय का बैंक खर्च
Net Government receipts|सरकारकडून आलेली निव्वळ रक्कम|सरकार से मिली कुल शुद्ध रकम
Net supplier payments|पुरवठादारांना दिलेली निव्वळ रक्कम|सामान देने वालों को दी शुद्ध रकम
Net sub-contractor payments|उपकंत्राटदारांना दिलेली निव्वळ रक्कम|उप-ठेकेदारों को दी शुद्ध रकम
Net labour payments|मजुरीसाठी दिलेली निव्वळ रक्कम|मज़दूरी के लिए दी शुद्ध रकम
Net other bank movements|इतर बँक व्यवहारांची निव्वळ रक्कम|अन्य बैंक लेनदेन की शुद्ध रकम
New|नवे|नया
New {0}|नवे {0}|नया {0}
Save {0} draft|{0} चा मसुदा जतन करा|{0} का ड्राफ्ट सेव करें
Search {0}|{0} शोधा|{0} खोजें
Search receipts|जमा नोंदी शोधा|जमा रिकॉर्ड खोजें
Search IDs, names or references|क्रमांक, नावे किंवा संदर्भ शोधा|नंबर, नाम या संदर्भ खोजें
Reference or Society|संदर्भ किंवा संस्था|संदर्भ या संस्था
Reference / Society|संदर्भ / संस्था|संदर्भ / संस्था
Reference / narration|संदर्भ / तपशील|संदर्भ / विवरण
Reference / treatment|संदर्भ / कराचा नियम|संदर्भ / कर का नियम
Payment ID / Society|पेमेंट क्रमांक / संस्था|पेमेंट नंबर / संस्था
Payment ID, bill, UTR or Society|पेमेंट क्रमांक, बिल, UTR किंवा संस्था|पेमेंट नंबर, बिल, UTR या संस्था
Payment ID 360|पेमेंटचा पूर्ण तपशील|पेमेंट की पूरी जानकारी
Project / work order|काम / कामाचा आदेश|काम / काम का आदेश
Claim / beneficiary|बिल / पैसे घेणारा|बिल / पैसे पाने वाला
Beneficiary / claim|पैसे घेणारा / बिल|पैसे पाने वाला / बिल
Credit / debit|जमा / खर्च|जमा / खर्च
Current status|सध्याची स्थिती|अभी की स्थिति
Method|पद्धत|तरीका
Not entered|भरलेले नाही|भरा नहीं गया
Not present|नाही|नहीं है
Next page|पुढील पान|अगला पेज
Previous page|मागील पान|पिछला पेज
Open consolidated report|एकत्रित अहवाल उघडा|संयुक्त रिपोर्ट खोलें
Open receipt|जमा नोंद उघडा|जमा रिकॉर्ड खोलें
Report|अहवाल|रिपोर्ट
Reports|अहवाल|रिपोर्ट
Report definitions and generation time|अहवालाचा अर्थ आणि तयार केल्याची वेळ|रिपोर्ट का अर्थ और बनाने का समय
Report info|अहवालाची माहिती|रिपोर्ट की जानकारी
Reset filters|निवड पुन्हा रिकामी करा|चुनाव फिर खाली करें
Privacy|खाजगी माहिती|निजी जानकारी
Totals|एकूण|कुल
Records|नोंदी|रिकॉर्ड
Transaction|व्यवहार|लेनदेन
Transaction ID|व्यवहार क्रमांक|लेनदेन नंबर
Whole payment|पूर्ण देयक|पूरा भुगतान
Single claim payment.|एका बिलाचे देयक.|एक बिल का भुगतान।
Unposted payment|हिशोबात न धरलेले देयक|हिसाब में शामिल नहीं हुआ भुगतान
Posted payments|हिशोबात नोंदवलेली देयके|हिसाब में दर्ज भुगतान
Return to draft|मसुद्यात परत न्या|ड्राफ्ट में वापस लाएँ
Reason for return, cancellation, failure or duplicate override|परतावा, रद्द करणे, अयशस्वी व्यवहार किंवा सारखी नोंद स्वीकारण्याचे कारण|वापसी, रद्द करने, असफल लेनदेन या एक जैसी एंट्री स्वीकारने का कारण
This is a separate debit if the amount and date match another payment|रक्कम आणि तारीख दुसऱ्या देयकाशी जुळत असली तरी हा वेगळा खर्च आहे|रकम और तारीख दूसरे भुगतान से मिलती हो तब भी यह अलग खर्च है
Reverse posted {0}|नोंदवलेल्या {0} ची उलट नोंद करा|दर्ज {0} की उलटी एंट्री करें
The original is retained. {0}|मूळ नोंद ठेवली जाते. {0}|मूल रिकॉर्ड रखा जाता है। {0}
This restores cash, claim pending and receipt availability once.|यामुळे रोख शिल्लक, बिलाची बाकी रक्कम आणि उपलब्ध जमा एकदाच पूर्ववत होतात.|इससे नकद बाकी रकम, बिल की बाकी रकम और उपलब्ध जमा एक बार वापस आती हैं।
Reversed on {0}. {1}|{0} रोजी उलट नोंद केली. {1}|{0} को उलटी एंट्री हुई। {1}
Reversed payments remain visible; their allocations are excluded from current allocated funds. Whole-payment amounts are not additive across receipt views.|उलट नोंद केलेली देयके दिसतात; त्यांचे वाटप सध्याच्या वाटपात धरत नाही. वेगवेगळ्या जमा नोंदींमध्ये दिसणाऱ्या एकाच पूर्ण देयकाची बेरीज पुन्हा करू नका.|उलटी एंट्री वाले भुगतान दिखते हैं; उनका बँटवारा अभी की बाँटी रकम में नहीं गिना जाता। अलग जमा रिकॉर्ड में दिखते एक ही पूरे भुगतान को दोबारा न जोड़ें।
Review source-linked totals, then export the same report offline.|मूळ नोंदींशी जोडलेली बेरीज तपासा आणि तोच अहवाल इंटरनेटशिवाय डाउनलोड करा.|मूल रिकॉर्ड से जुड़े जोड़ जाँचें और वही रिपोर्ट बिना इंटरनेट डाउनलोड करें।
Reviewed by: ____________________ &nbsp; Date: ____________________|तपासणाऱ्याचे नाव: ____________________ &nbsp; तारीख: ____________________|जाँचने वाले का नाम: ____________________ &nbsp; तारीख: ____________________
Print view prepared. Choose Save as PDF for a local PDF file.|छपाईचे पान तयार आहे. या संगणकावर PDF ठेवण्यासाठी Save as PDF निवडा.|प्रिंट पेज तैयार है। इस कंप्यूटर पर PDF रखने के लिए Save as PDF चुनें।
Search includes drafts and reversals. Amounts describe each record and must not be added across record types. Actions are attributed to the local workspace.|शोधात मसुदे आणि उलट नोंदीही येतात. प्रत्येक नोंदीची रक्कम वेगळी आहे; वेगवेगळ्या प्रकारांच्या रकमांची बेरीज करू नका. कृती या संगणकावरील काम म्हणून नोंदवल्या जातात.|खोज में ड्राफ्ट और उलटी एंट्री भी आती हैं। हर रिकॉर्ड की रकम अलग है; अलग प्रकारों की रकम न जोड़ें। कार्रवाइयाँ इस कंप्यूटर के काम के रूप में दर्ज होती हैं।
Tax figures are separate from cash. Use Payment ID 360 to review linked payments, tax and reconciliation. {0}|कराचे आकडे रोख रकमेपेक्षा वेगळे आहेत. जोडलेली देयके, कर आणि जुळवणी पाहण्यासाठी पेमेंटचा पूर्ण तपशील उघडा. {0}|कर के आँकड़े नकद रकम से अलग हैं। जुड़े भुगतान, कर और मिलान देखने के लिए पेमेंट की पूरी जानकारी खोलें। {0}
Related tax records|जोडलेल्या कर नोंदी|जुड़े कर रिकॉर्ड
Receipt IDs are assigned when posting, using the credit date’s Indian financial year (1 April–31 March). Outward IDs are assigned at posting using the bank debit date.|जमा नोंद करताना जमा तारखेच्या भारतीय आर्थिक वर्षानुसार (१ एप्रिल–३१ मार्च) क्रमांक मिळतो. देयकाचा क्रमांक बँकेतून पैसे गेल्याच्या तारखेनुसार मिळतो.|जमा दर्ज करते समय जमा तारीख के भारतीय वित्त वर्ष (१ अप्रैल–३१ मार्च) से नंबर मिलता है। भुगतान का नंबर बैंक से पैसे जाने की तारीख से मिलता है।
Posted bank movements, receipt funds and tax positions kept separate.|बँक व्यवहार, उपलब्ध जमा आणि कराची स्थिती वेगळी दाखवली आहे.|बैंक लेनदेन, उपलब्ध जमा और कर की स्थिति अलग दिखाई गई है।
Posted receipt credits are available in the bank book. Claims, payments, statement reconciliation and separate tax records are ready. All records work without internet.|नोंदवलेली जमा बँक हिशोबात दिसते. बिले, देयके, बँक जुळवणी आणि कराच्या वेगळ्या नोंदी तयार आहेत. सर्व काम इंटरनेटशिवाय होते.|दर्ज जमा बैंक हिसाब में दिखती है। बिल, भुगतान, बैंक मिलान और अलग कर रिकॉर्ड तैयार हैं। सब काम बिना इंटरनेट होता है।
Could not parse the statement.|स्टेटमेंट वाचता आले नाही.|स्टेटमेंट पढ़ा नहीं गया।
Could not read file.|फाइल वाचता आली नाही.|फ़ाइल पढ़ी नहीं गई।
Could not read the file.|फाइल वाचता आली नाही.|फ़ाइल पढ़ी नहीं गई।
Could not read this file.|ही फाइल वाचता आली नाही.|यह फ़ाइल पढ़ी नहीं गई।
File parsing timed out. Use a smaller statement.|फाइल वाचायला खूप वेळ लागला. लहान स्टेटमेंट वापरा.|फ़ाइल पढ़ने में बहुत समय लगा। छोटा स्टेटमेंट इस्तेमाल करें।
Select a non-empty file no larger than 2 MB.|रिकामी नसलेली, २ MB पेक्षा लहान फाइल निवडा.|खाली न हो और २ MB से बड़ी न हो, ऐसी फ़ाइल चुनें।
Select an evidence file no larger than 2 MB.|२ MB पर्यंतची पुराव्याची फाइल निवडा.|२ MB तक की सबूत फ़ाइल चुनें।
Select evidence no larger than 2 MB.|२ MB पर्यंतचा पुरावा निवडा.|२ MB तक का सबूत चुनें।
Select a record|नोंद निवडा|रिकॉर्ड चुनें
Select a source|मूळ नोंद निवडा|मूल रिकॉर्ड चुनें
Office address|कार्यालयाचा पत्ता|कार्यालय का पता
Sub-division|उपविभाग|उप-विभाग
Municipal authority|नगरपालिका|नगरपालिका
Work description|कामाचा तपशील|काम का विवरण
Work location|कामाचे ठिकाण|काम की जगह
Shared bank account justification|एकच बँक खाते वापरण्याचे कारण|एक ही बैंक खाता इस्तेमाल करने का कारण
Status (exact, optional)|स्थिती (अचूक, गरज असल्यास)|स्थिति (ठीक वही, ज़रूरत हो तो)
Start date|सुरुवातीची तारीख|शुरुआत की तारीख
Revision / approval notes|बदल / मंजुरीच्या टिपा|बदलाव / मंज़ूरी के नोट्स
Tax credit (INR)|कर जमा (₹)|कर क्रेडिट (₹)
{0}, {1}, {2}, remaining {3}|{0}, {1}, {2}, बाकी {3}|{0}, {1}, {2}, बाकी {3}
{0}, {1}, {2}%, from {3}|{0}, {1}, {2}%, {3} पासून|{0}, {1}, {2}%, {3} से
{0}. Allocated: {1}.|{0}. वाटप: {1}.|{0}। बँटवारा: {1}।
{0} evidence|{0} पुरावा|{0} सबूत
{0} on {1}. Bank reference: {2}. {3}|{1} रोजी {0}. बँक संदर्भ: {2}. {3}|{1} को {0}। बैंक संदर्भ: {2}। {3}
Credit date {0}. Bill {1}. Bank {2}.|जमा तारीख {0}. बिल {1}. बँक {2}.|जमा तारीख {0}। बिल {1}। बैंक {2}।
Credit date|जमा तारीख|जमा तारीख
Bank credit {0}|बँक जमा {0}|बैंक जमा {0}
Remove {0} row {1}|{0} ची ओळ {1} काढा|{0} की पंक्ति {1} हटाएँ
bank credit has been reversed|बँक जमा उलट केली आहे|बैंक जमा की उलटी एंट्री हुई है
bank debit has been returned or did not settle|बँक खर्च परत आला किंवा पूर्ण झाला नाही|बैंक खर्च वापस आया या पूरा नहीं हुआ
`
    .trim()
    .split("\n")
    .map((line) => {
      const [key, mr, hi] = line.split("|");
      return [key, [mr, hi]];
    }),
);
Object.assign(messages, extraMessages);
