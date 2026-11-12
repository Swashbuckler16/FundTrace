// Report captions, audit events and validation copy. English remains the API/storage language.
export const extraMessages = Object.fromEntries(
  `
(required)|(आवश्यक)|(ज़रूरी)
(posted)|(हिशोबात नोंदलेले)|(हिसाब में दर्ज)
(excluded from balances)|(शिल्लकीत धरलेले नाही)|(बाकी रकम में शामिल नहीं)
{0}, entered {1}|{0}, नोंद तारीख {1}|{0}, दर्ज तारीख {1}
{0}, Entered {1}, Local workspace|{0}, नोंद तारीख {1}, या संगणकावरील काम|{0}, दर्ज तारीख {1}, इस कंप्यूटर का काम
{0}, revision {1}|{0}, बदल क्रमांक {1}|{0}, बदलाव नंबर {1}
{0}, {1}, pending {2}|{0}, {1}, बाकी {2}|{0}, {1}, बाकी {2}
{0}, available {1}|{0}, उपलब्ध {1}|{0}, उपलब्ध {1}
Maintain {0} with stable IDs and a recorded change history.|{0} ची माहिती कायम क्रमांक आणि बदलांच्या इतिहासासह ठेवा.|{0} की जानकारी स्थायी नंबर और बदलाव के इतिहास के साथ रखें।
No {0} yet|अजून {0} नाहीत|अभी {0} नहीं हैं
Add your first {0} to establish a reusable master record.|सुरुवात करण्यासाठी पहिले {0} जोडा.|शुरू करने के लिए पहला {0} जोड़ें।
Activity|घडामोडी|गतिविधि
All banks|सर्व बँका|सभी बैंक
All beneficiaries|पैसे घेणारे सर्व|पैसे पाने वाले सभी
All departments|सर्व विभाग|सभी विभाग
All projects|सर्व कामे|सभी काम
All Societies / records|सर्व संस्था / नोंदी|सभी संस्थाएँ / रिकॉर्ड
All beneficiary payments|सर्वांना दिलेले पैसे|सभी को दिए पैसे
Bank evidence|बँकेचा पुरावा|बैंक का सबूत
Business date|व्यवहाराची तारीख|लेनदेन की तारीख
Government receipt register|सरकारी जमा नोंदवही|सरकारी जमा रजिस्टर
Supplier payment register|पुरवठादारांना दिलेल्या पैशांची नोंदवही|सामान देने वालों के भुगतान का रजिस्टर
Sub-contractor payment register|उपकंत्राटदारांना दिलेल्या पैशांची नोंदवही|उप-ठेकेदारों के भुगतान का रजिस्टर
Labour payment register|मजुरी दिल्याची नोंदवही|मज़दूरी भुगतान का रजिस्टर
Project financial summary|कामाच्या पैशांचा आढावा|काम के पैसों का सार
Society monthly / yearly summary|संस्थेचा मासिक / वार्षिक आढावा|संस्था का मासिक / सालाना सार
Claim pending|बिलाची बाकी रक्कम|बिल की बाकी रकम
Tax credit register|कर जमा नोंदवही|कर क्रेडिट रजिस्टर
Tax record|कर नोंद|कर रिकॉर्ड
claims|देय बिले|देय बिल
payments|देयके|भुगतान
Current receipt funds|सध्या उपलब्ध जमा रक्कम|अभी उपलब्ध जमा रकम
Current available tax credit (not cash)|सध्या उपलब्ध कर जमा (रोख नाही)|अभी उपलब्ध कर क्रेडिट (नकद नहीं)
Current available tax credit|सध्या उपलब्ध कर जमा|अभी उपलब्ध कर क्रेडिट
Current tax credit (not cash)|सध्याची कर जमा (रोख नाही)|अभी का कर क्रेडिट (नकद नहीं)
Current claim pending (not additive)|सध्याची बाकी बिल रक्कम (पुन्हा बेरीज करू नका)|अभी बाकी बिल रकम (दोबारा न जोड़ें)
Current credited|सध्या जमा झालेला कर|अभी जमा हुआ कर
Current expected credit pending|सध्या अपेक्षित पण बाकी कर जमा|अभी अनुमानित पर बाकी कर क्रेडिट
Current paid|सध्या दिलेली रक्कम|अभी दी गई रकम
Current pending|सध्या बाकी रक्कम|अभी बाकी रकम
Current set off|सध्या वापरलेला कर|अभी इस्तेमाल कर
Current utilisation %|सध्याचा वापर %|अभी का उपयोग %
Period tax credits / adjustments (not cash)|या काळातील कर जमा / दुरुस्ती (रोख नाही)|इस समय का कर क्रेडिट / सुधार (नकद नहीं)
Period tax set-off (not cash)|या काळातील वापरलेला कर (रोख नाही)|इस समय इस्तेमाल कर (नकद नहीं)
Period net receipts|या काळातील जमा, उलट नोंदी वजा करून|इस समय की जमा, उलटी एंट्री घटाकर
Period net outward payments|या काळातील देयके, उलट नोंदी वजा करून|इस समय के भुगतान, उलटी एंट्री घटाकर
Period net supplier payments|या काळातील पुरवठादार देयके, उलट नोंदी वजा करून|इस समय सामान देने वालों के भुगतान, उलटी एंट्री घटाकर
Period net sub-contractor payments|या काळातील उपकंत्राटदार देयके, उलट नोंदी वजा करून|इस समय उप-ठेकेदारों के भुगतान, उलटी एंट्री घटाकर
Period net labour payments|या काळातील मजुरी, उलट नोंदी वजा करून|इस समय की मज़दूरी, उलटी एंट्री घटाकर
Net bank charges (debit breakdown)|बँक शुल्क, उलट नोंदी वजा करून (खर्चाचा भाग)|बैंक शुल्क, उलटी एंट्री घटाकर (खर्च का हिस्सा)
Net other movements|इतर व्यवहार, उलट नोंदी वजा करून|अन्य लेनदेन, उलटी एंट्री घटाकर
Other bank credits|बँकेतील इतर जमा|बैंक की अन्य जमा
Other bank debits (including charges)|बँकेतील इतर खर्च (शुल्कासह)|बैंक के अन्य खर्च (शुल्क सहित)
Total bank credits|एकूण बँक जमा|कुल बैंक जमा
Total bank debits|एकूण बँक खर्च|कुल बैंक खर्च
Opening / initial balance|सुरुवातीची शिल्लक|शुरुआती बाकी रकम
Opening balance effective date|सुरुवातीची शिल्लक लागू तारीख|शुरुआती बाकी रकम की लागू तारीख
Masked account|लपवलेला खाते क्रमांक|छिपा खाता नंबर
Match status|जुळवणीची स्थिती|मिलान की स्थिति
Payment distribution|देयकाचे वाटप|भुगतान का बँटवारा
Record amount (not additive)|नोंदीची रक्कम (एकत्र बेरीज करू नका)|रिकॉर्ड की रकम (इकट्ठा न जोड़ें)
in the application folder.|अॅपच्या फोल्डरमध्ये.|ऐप के फ़ोल्डर में।
Maximum 2 MB and 2,000 rows. Files stay on this computer. Use a header row; sort rows from oldest to newest.|जास्तीत जास्त २ MB आणि २,००० ओळी. फाइल या संगणकावरच राहतात. पहिल्या ओळीत रकान्यांची नावे ठेवा; जुनी तारीख आधी ठेवा.|अधिकतम २ MB और २,००० पंक्तियाँ। फ़ाइलें इसी कंप्यूटर पर रहती हैं। पहली पंक्ति में कॉलम के नाम रखें; पुरानी तारीख पहले रखें।
FY {0}–{1}|आर्थिक वर्ष {0}–{1}|वित्त वर्ष {0}–{1}
Bank credit/debit date for cash; source-record date for registers; current position where labelled.|पैशांसाठी बँक जमा/खर्चाची तारीख; नोंदवहीसाठी मूळ नोंदीची तारीख; जिथे सांगितले आहे तिथे सध्याची स्थिती.|पैसों के लिए बैंक जमा/खर्च की तारीख; रजिस्टर के लिए मूल रिकॉर्ड की तारीख; जहाँ बताया है वहाँ अभी की स्थिति।
Balances, utilisation, claim pending and tax positions are CURRENT at generation, not historical snapshots. Period filters select the source records; cash movements use their own bank dates.|शिल्लक, वापर, बाकी बिले आणि कराची स्थिती अहवाल तयार करतानाची आहे, जुन्या तारखेची नाही. कालावधी निवडल्यावर त्या काळातील मूळ नोंदी येतात; पैशांसाठी बँकेच्या व्यवहाराची तारीख वापरली जाते.|बाकी रकम, उपयोग, बाकी बिल और कर की स्थिति रिपोर्ट बनाते समय की है, पुरानी तारीख की नहीं। समय चुनने पर उस समय के मूल रिकॉर्ड आते हैं; पैसों के लिए बैंक लेनदेन की तारीख ली जाती है।
Balances, utilisation, claim pending and tax positions are CURRENT at generation, not historical snapshots. Period filters select the source records; cash movements use their own bank dates. Each row is one beneficiary distribution, not another whole-bank debit. Claim amounts and whole-payment funding references repeat across instalments and are not totalled. Reversals have negative payment amounts.|शिल्लक, वापर, बाकी बिले आणि कराची स्थिती अहवाल तयार करतानाची आहे. प्रत्येक ओळ एका व्यक्तीला दिलेली रक्कम आहे; पुन्हा पूर्ण बँक खर्च नाही. हप्त्यांमध्ये बिलाची पूर्ण रक्कम आणि मूळ जमा संदर्भ पुन्हा दिसू शकतात; त्यांची पुन्हा बेरीज करू नका. उलट नोंदी उणे रकमेत दिसतात.|बाकी रकम, उपयोग, बाकी बिल और कर की स्थिति रिपोर्ट बनाते समय की है। हर पंक्ति एक व्यक्ति को दी रकम है; दोबारा पूरा बैंक खर्च नहीं। किस्तों में पूरे बिल की रकम और मूल जमा संदर्भ फिर दिख सकते हैं; उन्हें दोबारा न जोड़ें। उलटी एंट्री घटाव की रकम में दिखती है।
Bank credit/debit date basis. Posted originals and reversals are included on their own dates. Credits/debits are actual movements; net category columns include reversals and are breakdowns, not additional cash. Initial balances for accounts opened inside the period are included in Opening / initial balance. Tax uses event dates and is separate from cash; a bank filter includes only tax linked to that bank’s receipts. Current receipt funds and tax positions are as of generation.|हिशोब बँक जमा/खर्चाच्या तारखेवर आहे. मूळ आणि उलट नोंदी त्यांच्या तारखांना धरल्या आहेत. प्रकारानुसार दाखवलेल्या रकमेत उलट नोंदी आहेत; ही अतिरिक्त रोख रक्कम नाही. या काळात उघडलेल्या खात्यांची सुरुवातीची शिल्लकही धरली आहे. कराच्या बदलांची तारीख वेगळी आहे आणि कर रोख रकमेपासून वेगळा आहे. बँक निवडल्यास तिच्या जमा नोंदींशी जोडलेला करच दिसतो. उपलब्ध जमा आणि कराची स्थिती अहवाल तयार करतानाची आहे.|हिसाब बैंक जमा/खर्च की तारीख से है। मूल और उलटी एंट्री अपनी तारीखों पर गिनी हैं। प्रकार के अनुसार रकम में उलटी एंट्री शामिल हैं; यह अतिरिक्त नकद नहीं है। इस समय खुले खातों की शुरुआती बाकी रकम भी गिनी है। कर बदलाव की तारीख अलग है और कर नकद से अलग है। बैंक चुनने पर उसकी जमा से जुड़ा कर ही दिखता है। उपलब्ध जमा और कर की स्थिति रिपोर्ट बनाते समय की है।
Master created|मुख्य नोंद तयार केली|मुख्य रिकॉर्ड बनाया
Master updated|मुख्य नोंद बदलली|मुख्य रिकॉर्ड बदला
Restricted details viewed|लपवलेली माहिती पाहिली|छिपी जानकारी देखी
Receipt draft created|जमा मसुदा तयार केला|जमा ड्राफ्ट बनाया
Receipt draft updated|जमा मसुदा बदलला|जमा ड्राफ्ट बदला
Receipt evidence attached|जमा पुरावा जोडला|जमा का सबूत जोड़ा
Receipt posted|जमा हिशोबात नोंदवली|जमा हिसाब में दर्ज की
Claim created|बिल तयार केले|बिल बनाया
Claim draft updated|बिलाचा मसुदा बदलला|बिल का ड्राफ्ट बदला
Claim approved locally|बिल इथे मंजूर केले|बिल यहाँ मंज़ूर किया
Claim cancelled|बिल रद्द केले|बिल रद्द किया
Payment draft created|देयकाचा मसुदा तयार केला|भुगतान का ड्राफ्ट बनाया
Payment draft updated|देयकाचा मसुदा बदलला|भुगतान का ड्राफ्ट बदला
Payment evidence attached|देयकाचा पुरावा जोडला|भुगतान का सबूत जोड़ा
Payment submitted|देयक तपासणीसाठी दिले|भुगतान जाँच के लिए दिया
Payment approved|देयक मंजूर केले|भुगतान मंज़ूर किया
Payment posted|देयक हिशोबात नोंदवले|भुगतान हिसाब में दर्ज किया
Payment cancelled|देयक रद्द केले|भुगतान रद्द किया
Payment failed|देयक अयशस्वी झाले|भुगतान असफल हुआ
Payment returned|देयक परत आले|भुगतान वापस आया
Bank adjustment posted|इतर बँक व्यवहार नोंदवला|अन्य बैंक लेनदेन दर्ज किया
Bank statement imported|बँक स्टेटमेंट जोडले|बैंक स्टेटमेंट जोड़ा
Statement matched|स्टेटमेंट जुळवले|स्टेटमेंट का मिलान किया
Statement match removed|स्टेटमेंटची जुळवणी काढली|स्टेटमेंट का मिलान हटाया
Reconciliation exception created|जुळवणीचा प्रश्न नोंदवला|मिलान का सवाल दर्ज किया
Reconciliation exception updated|जुळवणीचा प्रश्न बदलला|मिलान का सवाल बदला
Bank period locked|बँक कालावधी लॉक केला|बैंक का समय लॉक किया
Bank period reopened|बँक कालावधी पुन्हा उघडला|बैंक का समय फिर खोला
Tax treatment configured|कराचा नियम ठरवला|कर का नियम तय किया
Tax record created|कर नोंद तयार केली|कर रिकॉर्ड बनाया
Tax credit recorded|कर जमा नोंदवली|कर क्रेडिट दर्ज किया
Tax Credit recorded|कर जमा नोंदवली|कर क्रेडिट दर्ज किया
Tax Set-off recorded|कर वापर नोंदवला|कर का उपयोग दर्ज किया
Tax Adjustment increase recorded|कर वाढीची दुरुस्ती नोंदवली|कर बढ़ाने का सुधार दर्ज किया
Tax Adjustment decrease recorded|कर घटवण्याची दुरुस्ती नोंदवली|कर घटाने का सुधार दर्ज किया
Tax Status recorded|कराची स्थिती बदलली|कर की स्थिति बदली
Report export prepared|अहवाल फाइल तयार केली|रिपोर्ट फ़ाइल बनाई
Local backup verified|बॅकअप तपासला|बैकअप जाँचा
Workspace restored from backup|बॅकअपमधून माहिती परत आणली|बैकअप से जानकारी वापस लाई
System|यंत्रणा|सिस्टम
Adjustment reversal|बँक व्यवहाराची उलट नोंद|बैंक लेनदेन की उलटी एंट्री
Claim ID|बिल क्रमांक|बिल नंबर
Approved net|मंजूर द्यायची रक्कम|मंज़ूर देने की रकम
Claim gross (not additive)|बिलाची पूर्ण रक्कम (पुन्हा बेरीज नको)|बिल की पूरी रकम (दोबारा न जोड़ें)
Claim deductions (not additive)|बिलातील कपात (पुन्हा बेरीज नको)|बिल की कटौती (दोबारा न जोड़ें)
Claim net (not additive)|बिलाची द्यायची रक्कम (पुन्हा बेरीज नको)|बिल की देने की रकम (दोबारा न जोड़ें)
Invoice / wage reference|बिल / मजुरीचा संदर्भ|बिल / मज़दूरी का संदर्भ
Invoice / work end / creation date|बिल / काम पूर्ण / नोंद तयार तारीख|बिल / काम पूरा / रिकॉर्ड बनाने की तारीख
Whole payment source allocations (not beneficiary attribution)|पूर्ण देयकासाठी मूळ जमा वाटप (व्यक्तीनुसार नाही)|पूरे भुगतान के लिए मूल जमा बँटवारा (व्यक्ति अनुसार नहीं)
Original credit date|मूळ जमा तारीख|मूल जमा तारीख
Original value date|मूळ लागू तारीख|मूल लागू तारीख
Original received|मूळ मिळालेली रक्कम|मूल मिली रकम
Contract value|कराराची रक्कम|करार की रकम
RA stage|कामाच्या बिलाचा टप्पा|काम के बिल का चरण
Work period|कामाचा कालावधी|काम का समय
Linked transactions|जोडलेले व्यवहार|जुड़े लेनदेन
Statement date|स्टेटमेंट तारीख|स्टेटमेंट तारीख
Signed statement amount|अधिक-उणे चिन्हासह स्टेटमेंट रक्कम|जोड़-घटाव निशान सहित स्टेटमेंट रकम
Signed bank credit|अधिक-उणे चिन्हासह बँक जमा|जोड़-घटाव निशान सहित बैंक जमा
Signed beneficiary payment|अधिक-उणे चिन्हासह दिलेले पैसे|जोड़-घटाव निशान सहित दिए पैसे
Matched magnitude|जुळलेली रक्कम|मिलाई गई रकम
Unmatched magnitude|न जुळलेली रक्कम|न मिलाई रकम
Open exception owner|बाकी प्रश्नाची जबाबदार व्यक्ती|बाकी सवाल का ज़िम्मेदार व्यक्ति
Open exception reason|बाकी प्रश्नाचे कारण|बाकी सवाल का कारण
Age in days|किती दिवस झाले|कितने दिन हुए
Fully utilised|पूर्ण वापरलेले|पूरा इस्तेमाल हुआ
Partially utilised|काही वापरलेले|कुछ इस्तेमाल हुआ
Unutilised|वापरलेले नाही|इस्तेमाल नहीं हुआ
Settlement|बिलाची देय स्थिती|बिल के भुगतान की स्थिति
Tax record date|कर नोंदीची तारीख|कर रिकॉर्ड की तारीख
Expected tax|अपेक्षित कर|अनुमानित कर
Deducted amount|कापलेली रक्कम|काटी गई रकम
Tax certificate / ledger reference|कर प्रमाणपत्र / नोंदवही संदर्भ|कर प्रमाणपत्र / रजिस्टर संदर्भ
Bank amount annotation|बँक रकमेची टिप|बैंक रकम का नोट
Base × rate, half-up to one paise|आधार × दर, जवळच्या पैशापर्यंत मोजलेले|आधार × दर, नज़दीकी पैसे तक गिना गया
Initial tax record|सुरुवातीची कर नोंद|शुरुआती कर रिकॉर्ड
Original payment|मूळ देयक|मूल भुगतान
{0} is required.|{0} भरणे आवश्यक आहे.|{0} भरना ज़रूरी है।
{0} must be a valid date.|{0} मध्ये योग्य तारीख भरा.|{0} में सही तारीख भरें।
{0} must be non-negative with no more than two decimal places.|{0} मध्ये शून्य किंवा त्यापेक्षा मोठी रक्कम भरा. दशांशानंतर जास्तीत जास्त दोन अंक वापरा.|{0} में शून्य या उससे बड़ी रकम भरें। दशमलव के बाद अधिकतम दो अंक रखें।
{0} must be text.|{0} मध्ये मजकूर भरा.|{0} में पाठ भरें।
{0} must be {1} characters or fewer.|{0} मध्ये जास्तीत जास्त {1} अक्षरे भरा.|{0} में अधिकतम {1} अक्षर भरें।
Enter a valid {0}.|योग्य {0} भरा.|सही {0} भरें।
Enter a valid email address.|योग्य ईमेल पत्ता भरा.|सही ईमेल पता भरें।
Account number must contain 6–24 digits.|खाते क्रमांकात ६ ते २४ अंक असावेत.|खाता नंबर में ६ से २४ अंक होने चाहिए।
IFSC must contain 11 characters (for example SBIN0001234).|IFSC मध्ये ११ अक्षरे/अंक हवेत (उदा. SBIN0001234).|IFSC में ११ अक्षर/अंक चाहिए (जैसे SBIN0001234)।
PAN format is invalid.|PAN योग्य नमुन्यात भरा.|PAN सही प्रारूप में भरें।
GSTIN format is invalid.|GSTIN योग्य नमुन्यात भरा.|GSTIN सही प्रारूप में भरें।
GST rate cannot exceed 100%.|GST दर १००% पेक्षा जास्त नसावा.|GST दर १००% से अधिक नहीं हो सकती।
Working percentage cannot exceed 100%.|कामाची टक्केवारी १००% पेक्षा जास्त नसावी.|काम का प्रतिशत १००% से अधिक नहीं हो सकता।
Expected end must be on or after start date.|अपेक्षित शेवटची तारीख सुरुवातीच्या तारखेपूर्वी नसावी.|अनुमानित आखिरी तारीख शुरू तारीख से पहले नहीं हो सकती।
Status must be Active or Inactive.|स्थिती चालू किंवा बंद निवडा.|स्थिति चालू या बंद चुनें।
Select a Society.|संस्था निवडा.|संस्था चुनें।
Select an existing Society.|नोंदवलेली संस्था निवडा.|दर्ज संस्था चुनें।
Select a project status.|कामाची स्थिती निवडा.|काम की स्थिति चुनें।
Select a beneficiary category.|पैसे घेणाऱ्याचा प्रकार निवडा.|पैसे पाने वाले का प्रकार चुनें।
Select an account type.|खात्याचा प्रकार निवडा.|खाते का प्रकार चुनें।
Society code must contain 2–8 letters or digits.|संस्थेच्या कोडमध्ये २ ते ८ इंग्रजी अक्षरे किंवा अंक हवेत.|संस्था के कोड में २ से ८ अंग्रेज़ी अक्षर या अंक चाहिए।
Society code already exists.|हा संस्था कोड आधीच आहे.|यह संस्था कोड पहले से है।
Society code is immutable.|संस्थेचा कोड बदलता येत नाही.|संस्था का कोड बदला नहीं जा सकता।
A record cannot be moved to another Society.|नोंद दुसऱ्या संस्थेत हलवता येत नाही.|रिकॉर्ड दूसरी संस्था में नहीं ले जा सकते।
A record with this name already exists. Enter a duplicate-name reason of at least 10 characters.|या नावाची नोंद आधीच आहे. सारखे नाव ठेवण्याचे कारण किमान १० अक्षरांत भरा.|इस नाम का रिकॉर्ड पहले से है। एक जैसा नाम रखने का कारण कम से कम १० अक्षरों में भरें।
Reactivate the Society before creating or editing active records.|चालू नोंदी जोडण्यापूर्वी किंवा बदलण्यापूर्वी संस्था पुन्हा चालू करा.|चालू रिकॉर्ड जोड़ने या बदलने से पहले संस्था फिर चालू करें।
Department and work order number are required.|विभाग आणि कामाच्या आदेशाचा क्रमांक भरा.|विभाग और काम के आदेश का नंबर भरें।
This work order already exists for this Society and department.|या संस्था आणि विभागासाठी हा कामाचा आदेश आधीच आहे.|इस संस्था और विभाग के लिए यह काम का आदेश पहले से है।
Bank name, account number and IFSC are required.|बँकेचे नाव, खाते क्रमांक आणि IFSC भरा.|बैंक का नाम, खाता नंबर और IFSC भरें।
This bank account is already registered for this Society.|हे बँक खाते या संस्थेसाठी आधीच नोंदवले आहे.|यह बैंक खाता इस संस्था के लिए पहले से दर्ज है।
Bank opening balance, date and account number are locked once financial history exists.|व्यवहार नोंदवल्यावर सुरुवातीची बँक शिल्लक, तारीख आणि खाते क्रमांक बदलता येत नाही.|लेनदेन दर्ज होने के बाद शुरुआती बैंक बाकी रकम, तारीख और खाता नंबर नहीं बदल सकते।
Provide all beneficiary bank details, or leave all three empty.|पैसे घेणाऱ्याची बँकेची तिन्ही माहिती भरा किंवा तिन्ही रिकामी ठेवा.|पैसे पाने वाले की बैंक की तीनों जानकारियाँ भरें या तीनों खाली छोड़ें।
This account is shared with another beneficiary. Enter a documented reason of at least 10 characters.|हे खाते दुसऱ्या पैसे घेणाऱ्याचेही आहे. कारण किमान १० अक्षरांत नोंदवा.|यह खाता दूसरे पैसे पाने वाले का भी है। कारण कम से कम १० अक्षरों में दर्ज करें।
This record changed since you opened it. Reload before saving.|तुम्ही उघडल्यानंतर ही नोंद बदलली आहे. जतन करण्यापूर्वी पुन्हा उघडा.|आपके खोलने के बाद यह रिकॉर्ड बदला है। सेव करने से पहले फिर खोलें।
Record changed. Reload before continuing.|नोंद बदलली आहे. पुढे जाण्यापूर्वी पुन्हा उघडा.|रिकॉर्ड बदला है। आगे बढ़ने से पहले फिर खोलें।
Record not found.|नोंद सापडली नाही.|रिकॉर्ड नहीं मिला।
Amount must be positive.|रक्कम शून्यापेक्षा जास्त भरा.|रकम शून्य से अधिक भरें।
Amount exceeds the supported range.|रक्कम या अॅपच्या मर्यादेपेक्षा जास्त आहे.|रकम इस ऐप की सीमा से अधिक है।
Amount exceeds the supported monetary range.|रक्कम या अॅपच्या मर्यादेपेक्षा जास्त आहे.|रकम इस ऐप की सीमा से अधिक है।
A receipt cannot move to another Society.|जमा नोंद दुसऱ्या संस्थेत हलवता येत नाही.|जमा रिकॉर्ड दूसरी संस्था में नहीं ले जा सकते।
Receipt not found.|जमा नोंद सापडली नाही.|जमा रिकॉर्ड नहीं मिला।
Receipt changed. Reload before saving.|जमा नोंद बदलली आहे. जतन करण्यापूर्वी पुन्हा उघडा.|जमा रिकॉर्ड बदला है। सेव करने से पहले फिर खोलें।
Receipt changed. Reload before adding evidence.|जमा नोंद बदलली आहे. पुरावा जोडण्यापूर्वी पुन्हा उघडा.|जमा रिकॉर्ड बदला है। सबूत जोड़ने से पहले फिर खोलें।
Receipt changed. Reload before posting.|जमा नोंद बदलली आहे. हिशोबात नोंदवण्यापूर्वी पुन्हा उघडा.|जमा रिकॉर्ड बदला है। हिसाब में दर्ज करने से पहले फिर खोलें।
Receipt has already been posted.|ही जमा आधीच हिशोबात नोंदवली आहे.|यह जमा पहले से हिसाब में दर्ज है।
Select an active department.|चालू विभाग निवडा.|चालू विभाग चुनें।
Select an active bank account.|चालू बँक खाते निवडा.|चालू बैंक खाता चुनें।
Select an active {0} record.|चालू {0} नोंद निवडा.|चालू {0} रिकॉर्ड चुनें।
Project must belong to the selected Society and department.|निवडलेल्या संस्था आणि विभागाचे काम निवडा.|चुनी संस्था और विभाग का काम चुनें।
Project must belong to the selected Society.|निवडलेल्या संस्थेचे काम निवडा.|चुनी संस्था का काम चुनें।
Project must belong to this Society.|याच संस्थेचे काम निवडा.|इसी संस्था का काम चुनें।
Bank account must belong to the selected Society.|निवडलेल्या संस्थेचे बँक खाते निवडा.|चुनी संस्था का बैंक खाता चुनें।
Beneficiary must belong to the selected Society.|निवडलेल्या संस्थेतील पैसे घेणारा निवडा.|चुनी संस्था का पैसे पाने वाला चुनें।
Credited amount must be greater than zero.|जमा रक्कम शून्यापेक्षा जास्त भरा.|जमा रकम शून्य से अधिक भरें।
Credit date and value date are required.|जमा तारीख आणि लागू तारीख भरा.|जमा तारीख और लागू तारीख भरें।
Credit date must be on or after the bank opening balance date.|जमा तारीख सुरुवातीच्या बँक शिल्लकीच्या तारखेपूर्वी नसावी.|जमा तारीख शुरुआती बैंक बाकी रकम की तारीख से पहले नहीं हो सकती।
Select a valid bill type.|योग्य बिल प्रकार निवडा.|सही बिल प्रकार चुनें।
Select a valid payment mode.|योग्य पैसे देण्याची पद्धत निवडा.|सही भुगतान तरीका चुनें।
Invalid payment mode.|पैसे देण्याची पद्धत चुकीची आहे.|भुगतान का तरीका गलत है।
Enter a bank reference, cheque number, or narration for Other mode.|बँक संदर्भ, धनादेश क्रमांक किंवा इतर पद्धतीसाठी तपशील भरा.|बैंक संदर्भ, चेक नंबर या अन्य तरीके के लिए विवरण भरें।
Attach bank evidence before posting.|हिशोबात नोंद करण्यापूर्वी बँकेचा पुरावा जोडा.|हिसाब में दर्ज करने से पहले बैंक का सबूत जोड़ें।
Confirm that this credit appears in the bank account.|ही जमा बँक खात्यात दिसते याची खात्री करा.|पुष्टि करें कि यह जमा बैंक खाते में दिखती है।
Possible duplicate bank credit. Review the linked receipts and explicitly override with a reason of at least 10 characters.|ही जमा पुन्हा नोंदवली जात असू शकते. जोडलेल्या जमा तपासा आणि पुढे जाण्यासाठी किमान १० अक्षरांचे कारण द्या.|यह जमा दोबारा दर्ज हो सकती है। जुड़ी जमा जाँचें और आगे बढ़ने के लिए कम से कम १० अक्षरों का कारण दें।
This bank reference or cheque has already been posted.|हा बँक संदर्भ किंवा धनादेश आधीच नोंदवला आहे.|यह बैंक संदर्भ या चेक पहले से दर्ज है।
Evidence is locked after posting.|हिशोबात नोंद केल्यावर पुरावा बदलता येत नाही.|हिसाब में दर्ज करने के बाद सबूत नहीं बदल सकता।
Maximum five evidence files per receipt.|एका जमा नोंदीला जास्तीत जास्त ५ पुराव्याच्या फाइल जोडा.|एक जमा रिकॉर्ड में अधिकतम ५ सबूत फ़ाइलें जोड़ें।
Maximum five evidence files per payment.|एका देयकाला जास्तीत जास्त ५ पुराव्याच्या फाइल जोडा.|एक भुगतान में अधिकतम ५ सबूत फ़ाइलें जोड़ें।
Upload a PDF, PNG or JPEG evidence file.|PDF, PNG किंवा JPEG पुराव्याची फाइल जोडा.|PDF, PNG या JPEG सबूत फ़ाइल जोड़ें।
Evidence must be between 1 byte and 2 MB.|पुराव्याची फाइल रिकामी नसावी आणि २ MB पेक्षा मोठी नसावी.|सबूत फ़ाइल खाली नहीं होनी चाहिए और २ MB से बड़ी नहीं होनी चाहिए।
Invalid file encoding.|फाइल योग्य स्वरूपात नाही. दुसरी प्रत निवडा.|फ़ाइल सही रूप में नहीं है। दूसरी कॉपी चुनें।
Evidence not found.|पुरावा सापडला नाही.|सबूत नहीं मिला।
Use a plain file name.|फाइलसाठी साधे नाव वापरा.|फ़ाइल का साधारण नाम रखें।
A claim cannot move Society.|बिल दुसऱ्या संस्थेत हलवता येत नाही.|बिल दूसरी संस्था में नहीं ले जा सकते।
A payment cannot move Society.|देयक दुसऱ्या संस्थेत हलवता येत नाही.|भुगतान दूसरी संस्था में नहीं ले जा सकते।
Only draft claims can be edited.|फक्त मसुद्यातील बिल बदलता येते.|केवल ड्राफ्ट बिल बदल सकते हैं।
Only draft payments can be edited.|फक्त मसुद्यातील देयक बदलता येते.|केवल ड्राफ्ट भुगतान बदल सकते हैं।
Closed projects cannot receive new claims or payments.|बंद कामासाठी नवीन बिले किंवा देयके नोंदवता येत नाहीत.|बंद काम के लिए नए बिल या भुगतान दर्ज नहीं कर सकते।
Net claim amount must be positive after deductions.|कपातीनंतर बिलाची रक्कम शून्यापेक्षा जास्त असावी.|कटौती के बाद बिल की रकम शून्य से अधिक होनी चाहिए।
GST included in gross cannot exceed gross.|बिलातील GST पूर्ण बिलाच्या रकमेपेक्षा जास्त नसावा.|बिल का GST पूरे बिल की रकम से अधिक नहीं हो सकता।
This beneficiary claim reference already exists. Record another instalment against the existing claim.|या व्यक्तीच्या बिलाचा संदर्भ आधीच आहे. त्याच बिलावर पुढचा हप्ता नोंदवा.|इस व्यक्ति के बिल का संदर्भ पहले से है। उसी बिल पर अगली किस्त दर्ज करें।
Supplier invoice date is required.|पुरवठादाराच्या बिलाची तारीख भरा.|सामान देने वाले के बिल की तारीख भरें।
Work description and certification reference are required.|कामाचा तपशील आणि तपासणीचा संदर्भ भरा.|काम का विवरण और जाँच का संदर्भ भरें।
Labour claims require a work period and attendance / certification reference.|मजुरीच्या बिलासाठी कामाचा कालावधी आणि हजेरी / तपासणी संदर्भ भरा.|मज़दूरी बिल के लिए काम का समय और हाज़िरी / जाँच संदर्भ भरें।
Individual labour claims require days / quantity and rate.|वैयक्तिक मजुरीच्या बिलासाठी दिवस / प्रमाण आणि दर भरा.|व्यक्तिगत मज़दूरी बिल के लिए दिन / मात्रा और दर भरें।
Days / quantity and rate must be positive numeric values.|दिवस / प्रमाण आणि दर शून्यापेक्षा मोठे अंक असावेत.|दिन / मात्रा और दर शून्य से बड़ी संख्याएँ हों।
Work period end must follow its start.|काम संपण्याची तारीख सुरुवातीनंतर असावी.|काम खत्म होने की तारीख शुरुआत के बाद होनी चाहिए।
Claim state does not allow this action.|बिलाच्या सध्याच्या स्थितीत ही कृती करता येत नाही.|बिल की अभी की स्थिति में यह कार्रवाई नहीं हो सकती।
Payment state does not allow this action.|देयकाच्या सध्याच्या स्थितीत ही कृती करता येत नाही.|भुगतान की अभी की स्थिति में यह कार्रवाई नहीं हो सकती।
Explicit local confirmation is required.|पुढे जाण्यापूर्वी खात्रीची खूण करा.|आगे बढ़ने से पहले पुष्टि का निशान लगाएँ।
Attach supporting payment evidence before submission.|तपासणीसाठी देण्यापूर्वी देयकाचा पुरावा जोडा.|जाँच के लिए देने से पहले भुगतान का सबूत जोड़ें।
Return the payment to draft before attaching evidence.|पुरावा जोडण्यापूर्वी देयक मसुद्यात परत न्या.|सबूत जोड़ने से पहले भुगतान ड्राफ्ट में वापस लाएँ।
Provide the payment reference, cheque number or cash/other remarks.|देयक संदर्भ, धनादेश क्रमांक किंवा रोख/इतर तपशील भरा.|भुगतान संदर्भ, चेक नंबर या नकद/अन्य विवरण भरें।
Provide between 1 and 100 {0} rows.|{0} च्या १ ते १०० ओळी भरा.|{0} की १ से १०० पंक्तियाँ भरें।
Every row amount must be positive.|प्रत्येक ओळीतील रक्कम शून्यापेक्षा जास्त असावी.|हर पंक्ति की रकम शून्य से अधिक होनी चाहिए।
Combine repeated selections into one row.|एकच नोंद पुन्हा निवडली असल्यास एका ओळीत एकत्र करा.|एक ही रिकॉर्ड दोबारा चुना हो तो एक पंक्ति में जोड़ें।
Select approved claims from this Society and project.|याच संस्था आणि कामाची मंजूर बिले निवडा.|इसी संस्था और काम के मंज़ूर बिल चुनें।
Batch distributions must be labour claims.|गटाच्या वाटपात फक्त मजुरीची बिले असावीत.|समूह बँटवारे में केवल मज़दूरी के बिल हों।
Use a batch for multiple claim distributions.|अनेक बिलांवर वाटप करण्यासाठी गटाचा पर्याय वापरा.|कई बिलों में बाँटने के लिए समूह का विकल्प लें।
Funding must use posted receipts from the same Society, project and bank account.|याच संस्था, काम आणि बँक खात्याच्या हिशोबात नोंदलेल्या जमेतून पैसे जोडा.|इसी संस्था, काम और बैंक खाते की हिसाब में दर्ज जमा से रकम जोड़ें।
Receipt allocations must equal the bank debit.|जमा नोंदींतून घेतलेली एकूण रक्कम बँक खर्चाएवढी असावी.|जमा रिकॉर्ड से ली कुल रकम बैंक खर्च के बराबर होनी चाहिए।
Distributions and allocations must equal the bank debit.|व्यक्तींना वाटप आणि जमेतून घेतलेली रक्कम दोन्ही बँक खर्चाएवढी असावीत.|लोगों में बाँटी और जमा से ली रकम, दोनों बैंक खर्च के बराबर हों।
Payment exceeds the remaining claim amount.|देयक बिलाच्या बाकी रकमेपेक्षा जास्त आहे.|भुगतान बिल की बाकी रकम से अधिक है।
Allocation exceeds the available receipt balance. Reload and revise the draft.|वाटप उपलब्ध जमा रकमेपेक्षा जास्त आहे. पुन्हा उघडा आणि मसुदा बदला.|बँटवारा उपलब्ध जमा रकम से अधिक है। फिर खोलें और ड्राफ्ट बदलें।
Payment date cannot precede its funding receipt.|देयकाची तारीख त्यासाठी वापरलेल्या जमा तारखेपूर्वी नसावी.|भुगतान की तारीख उसके लिए इस्तेमाल जमा तारीख से पहले नहीं हो सकती।
Payment date precedes the bank opening balance date.|देयकाची तारीख सुरुवातीच्या बँक शिल्लकीच्या तारखेपूर्वी आहे.|भुगतान की तारीख शुरुआती बैंक बाकी रकम से पहले है।
Possible duplicate amount and date. Confirm a separate debit and provide a reason.|रक्कम आणि तारीख दुसऱ्या नोंदीसारखी आहे. हा वेगळा खर्च असल्याची खात्री करून कारण द्या.|रकम और तारीख दूसरी एंट्री जैसी हैं। अलग खर्च की पुष्टि करके कारण दें।
Corrections must link to a reversed, failed or cancelled payment in this Society.|दुरुस्ती याच संस्थेच्या उलट नोंद केलेल्या, अयशस्वी किंवा रद्द देयकाशी जोडा.|सुधार इसी संस्था के उलटी एंट्री वाले, असफल या रद्द भुगतान से जोड़ें।
Only an unreversed posted record can be reversed.|हिशोबात नोंद असलेली आणि आधी उलट न केलेली नोंदच उलट करता येते.|केवल हिसाब में दर्ज और पहले उलटी न की गई एंट्री उलटी कर सकते हैं।
Reverse all linked payments before reversing this receipt.|ही जमा उलट करण्यापूर्वी सर्व जोडलेल्या देयकांची उलट नोंद करा.|यह जमा उलटी करने से पहले सभी जुड़े भुगतानों की उलटी एंट्री करें।
Reverse posted payments before cancelling this claim.|हे बिल रद्द करण्यापूर्वी हिशोबातील देयकांची उलट नोंद करा.|यह बिल रद्द करने से पहले हिसाब के भुगतानों की उलटी एंट्री करें।
Reversal date cannot precede the original bank movement.|उलट नोंदीची तारीख मूळ बँक व्यवहारापूर्वी नसावी.|उलटी एंट्री की तारीख मूल बैंक लेनदेन से पहले नहीं हो सकती।
Use a date on or after the latest linked payment reversal; released funding cannot be backdated.|जोडलेल्या शेवटच्या उलट देयकाच्या तारखेची किंवा नंतरची तारीख वापरा. परत उपलब्ध झालेल्या पैशांना आधीची तारीख देता येत नाही.|जुड़े आखिरी उलटे भुगतान की तारीख या बाद की तारीख लें। वापस उपलब्ध रकम को पहले की तारीख नहीं दे सकते।
Reason must contain at least 10 characters.|कारण किमान १० अक्षरांत लिहा.|कारण कम से कम १० अक्षरों में लिखें।
Bank balance exceeds the supported monetary range.|बँक शिल्लक अॅपच्या मर्यादेपेक्षा जास्त आहे.|बैंक की बाकी रकम ऐप की सीमा से अधिक है।
This movement would overdraw the bank book on its date or a later date.|या व्यवहारामुळे त्याच दिवशी किंवा नंतर बँक शिल्लक उणे होईल.|इस लेनदेन से उसी दिन या बाद में बैंक की बाकी रकम शून्य से कम होगी।
This bank period is locked. Reopen it with a reason before changing this date or an earlier balance.|हा बँक कालावधी लॉक आहे. ही तारीख किंवा आधीची शिल्लक बदलण्यापूर्वी कारण देऊन पुन्हा उघडा.|बैंक का यह समय लॉक है। यह तारीख या पुरानी बाकी रकम बदलने से पहले कारण देकर फिर खोलें।
A bank period for this Society is locked. Reopen it before changing historical tax records.|या संस्थेचा बँक कालावधी लॉक आहे. जुन्या कर नोंदी बदलण्यापूर्वी तो उघडा.|इस संस्था का बैंक समय लॉक है। पुराने कर रिकॉर्ड बदलने से पहले उसे खोलें।
Bank account not found.|बँक खाते सापडले नाही.|बैंक खाता नहीं मिला।
Statement dates must be ordered and on or after the bank opening date.|स्टेटमेंटच्या तारखा क्रमाने आणि बँक उघडल्याच्या तारखेपासून पुढे असाव्यात.|स्टेटमेंट की तारीखें क्रम में और बैंक खुलने की तारीख से आगे होनी चाहिए।
Import between 1 and 2,000 statement rows.|स्टेटमेंटच्या १ ते २,००० ओळी जोडा.|स्टेटमेंट की १ से २,००० पंक्तियाँ जोड़ें।
Statement evidence must be between 1 byte and 2 MB.|स्टेटमेंट फाइल रिकामी नसावी आणि २ MB पेक्षा मोठी नसावी.|स्टेटमेंट फ़ाइल खाली न हो और २ MB से बड़ी न हो।
Statement closing balance does not equal opening plus credits minus debits.|अखेरची शिल्लक = सुरुवातीची शिल्लक + जमा − खर्च असे जुळत नाही. रक्कम तपासा.|आखिरी बाकी रकम = शुरुआती बाकी रकम + जमा − खर्च का मिलान नहीं होता। रकम जाँचें।
This statement period overlaps an existing import for this bank. Import a separate consecutive period instead.|या बँकेसाठी या काळातील स्टेटमेंट आधीच आहे. वेगळ्या सलग काळाचे स्टेटमेंट जोडा.|इस बैंक के लिए इस समय का स्टेटमेंट पहले से है। अलग लगातार समय का स्टेटमेंट जोड़ें।
This import overlaps existing statement lines. Remove already imported lines and correct the opening balance before importing.|काही ओळी आधी जोडलेल्या आहेत. त्या काढा आणि सुरुवातीची शिल्लक दुरुस्त करून पुन्हा जोडा.|कुछ पंक्तियाँ पहले जोड़ी हैं। उन्हें हटाएँ और शुरुआती बाकी रकम ठीक करके फिर जोड़ें।
Row {0}: a reference or narration is required.|ओळ {0}: संदर्भ किंवा तपशील भरा.|पंक्ति {0}: संदर्भ या विवरण भरें।
Row {0}: duplicate line within this import.|ओळ {0}: या फाइलमध्ये हीच ओळ पुन्हा आली आहे.|पंक्ति {0}: इस फ़ाइल में वही पंक्ति फिर आई है।
Row {0}: enter exactly one positive debit or credit.|ओळ {0}: जमा किंवा खर्च यांपैकी एकच शून्यापेक्षा जास्त रक्कम भरा.|पंक्ति {0}: जमा या खर्च में केवल एक शून्य से बड़ी रकम भरें।
Row {0}: running balance does not agree with the statement opening and movements.|ओळ {0}: दिलेली शिल्लक सुरुवातीची शिल्लक आणि व्यवहारांशी जुळत नाही.|पंक्ति {0}: दी बाकी रकम शुरुआती बाकी रकम और लेनदेन से नहीं मिलती।
Row {0}: sort dates ascending and keep them inside the statement period.|ओळ {0}: जुन्या तारखा आधी ठेवा आणि सर्व तारखा स्टेटमेंटच्या काळातील असू द्या.|पंक्ति {0}: पुरानी तारीख पहले रखें और सभी तारीखें स्टेटमेंट के समय के भीतर हों।
Statement line not found.|स्टेटमेंटची ओळ सापडली नाही.|स्टेटमेंट की पंक्ति नहीं मिली।
Select between 1 and 100 matching bank movements.|जुळणारे १ ते १०० बँक व्यवहार निवडा.|मिलते हुए १ से १०० बैंक लेनदेन चुनें।
Match amounts must be positive and movement selections unique.|जुळवायची रक्कम शून्यापेक्षा जास्त ठेवा आणि एकच व्यवहार पुन्हा निवडू नका.|मिलाने की रकम शून्य से अधिक रखें और एक ही लेनदेन दोबारा न चुनें।
Match a movement from this bank with the same credit/debit direction.|याच बँकेचा व्यवहार निवडा; जमा जमेशी आणि खर्च खर्चाशी जुळवा.|इसी बैंक का लेनदेन चुनें; जमा को जमा और खर्च को खर्च से मिलाएँ।
Match exceeds the unmatched bank movement amount.|जुळवायची रक्कम बँक व्यवहाराच्या बाकी रकमेपेक्षा जास्त आहे.|मिलाने की रकम बैंक लेनदेन की बाकी रकम से अधिक है।
Match exceeds the unmatched statement amount.|जुळवायची रक्कम स्टेटमेंटच्या बाकी रकमेपेक्षा जास्त आहे.|मिलाने की रकम स्टेटमेंट की बाकी रकम से अधिक है।
Active match not found.|चालू जुळवणी सापडली नाही.|चालू मिलान नहीं मिला।
Exception changed. Reload before saving.|प्रश्नाची नोंद बदलली आहे. जतन करण्यापूर्वी पुन्हा उघडा.|सवाल का रिकॉर्ड बदला है। सेव करने से पहले फिर खोलें।
Invalid exception status.|प्रश्नासाठी योग्य स्थिती निवडा.|सवाल के लिए सही स्थिति चुनें।
Select a movement category.|व्यवहाराचा प्रकार निवडा.|लेनदेन का प्रकार चुनें।
Movement precedes bank opening date.|व्यवहाराची तारीख बँक उघडल्याच्या तारखेपूर्वी आहे.|लेनदेन की तारीख बैंक खुलने से पहले है।
Select an original movement in this bank.|याच बँकेतील मूळ व्यवहार निवडा.|इसी बैंक का मूल लेनदेन चुनें।
A reversal must exactly offset its original on the same or a later date.|उलट नोंद मूळ रकमेएवढी आणि त्याच किंवा नंतरच्या तारखेला असावी.|उलटी एंट्री मूल रकम जितनी और उसी या बाद की तारीख पर हो।
This movement is already reversed.|या व्यवहाराची उलट नोंद आधीच झाली आहे.|इस लेनदेन की उलटी एंट्री पहले से हो चुकी है।
This adjustment reference already exists for this bank.|या बँकेसाठी हा व्यवहार संदर्भ आधीच आहे.|इस बैंक के लिए यह लेनदेन संदर्भ पहले से है।
Choose a valid bank period.|योग्य बँक कालावधी निवडा.|सही बैंक समय चुनें।
This period overlaps an existing lock.|हा कालावधी आधी लॉक केलेल्या काळात येतो.|यह समय पहले लॉक किए समय में आता है।
Import statement evidence before locking this period.|कालावधी लॉक करण्यापूर्वी स्टेटमेंटचा पुरावा जोडा.|समय लॉक करने से पहले स्टेटमेंट का सबूत जोड़ें।
Statement imports must cover the exact lock period.|लॉक करायच्या पूर्ण काळाचे स्टेटमेंट जोडा.|लॉक करने वाले पूरे समय का स्टेटमेंट जोड़ें।
Statement periods must be contiguous, non-overlapping and carry forward the closing balance.|स्टेटमेंटचे कालावधी सलग असावेत, एकाच तारखा पुन्हा नसाव्यात आणि आधीची अखेरची शिल्लक पुढे घ्यावी.|स्टेटमेंट का समय लगातार हो, एक तारीख दोबारा न हो और पहले की आखिरी बाकी रकम आगे आए।
Resolve exceptions and fully match every statement line before locking.|लॉक करण्यापूर्वी सर्व प्रश्न सोडवा आणि प्रत्येक स्टेटमेंट ओळ पूर्ण जुळवा.|लॉक करने से पहले सभी सवाल सुलझाएँ और हर स्टेटमेंट पंक्ति पूरी मिलाएँ।
Every bank-book movement in the period must be fully matched.|या काळातील बँक हिशोबाचा प्रत्येक व्यवहार पूर्ण जुळवा.|इस समय के बैंक हिसाब का हर लेनदेन पूरी तरह मिलाएँ।
Statement opening/closing balances do not agree with the bank book.|स्टेटमेंटची सुरुवातीची/अखेरची शिल्लक बँक हिशोबाशी जुळत नाही.|स्टेटमेंट की शुरुआती/आखिरी बाकी रकम बैंक हिसाब से नहीं मिलती।
Locked period not found.|लॉक केलेला कालावधी सापडला नाही.|लॉक किया समय नहीं मिला।
Period changed. Reload before reopening.|कालावधीची नोंद बदलली आहे. पुन्हा उघडण्यापूर्वी पान रीलोड करा.|समय का रिकॉर्ड बदला है। फिर खोलने से पहले पेज रीलोड करें।
Reopen later locked periods first.|नंतरचे लॉक केलेले कालावधी आधी उघडा.|बाद वाले लॉक समय पहले खोलें।
Rate must be between 0 and 100 percent.|दर ० ते १०० टक्क्यांच्या दरम्यान ठेवा.|दर ० से १०० प्रतिशत के बीच रखें।
Add a later effective date for this Society/treatment; historical rule versions cannot be replaced.|या संस्थेच्या कर नियमासाठी पुढची लागू तारीख द्या. जुने नियम बदलता येत नाहीत.|इस संस्था के कर नियम के लिए अगली लागू तारीख दें। पुराने नियम नहीं बदल सकते।
Choose an effective tax treatment for this Society/date.|या संस्था आणि तारखेसाठी लागू कर नियम निवडा.|इस संस्था और तारीख पर लागू कर नियम चुनें।
Choose the latest treatment effective on the tax date.|कराच्या तारखेला लागू असलेला सर्वात नवा नियम निवडा.|कर की तारीख पर लागू सबसे नया नियम चुनें।
Link a posted receipt in this Society/project.|याच संस्था/कामाची हिशोबात नोंदलेली जमा जोडा.|इसी संस्था/काम की हिसाब में दर्ज जमा जोड़ें।
Bank amount annotations require an actual linked receipt. They never post cash.|बँक रकमेच्या टिपेसाठी खरी जमा नोंद जोडा. टिपेमुळे रोख रक्कम वाढत नाही.|बैंक रकम के नोट के लिए असली जमा रिकॉर्ड जोड़ें। नोट से नकद रकम नहीं बढ़ती।
Bank annotation cannot exceed the linked receipt credit.|बँक टिपेची रक्कम जोडलेल्या जमा रकमेपेक्षा जास्त नसावी.|बैंक नोट की रकम जुड़ी जमा रकम से अधिक न हो।
Select an initial tax status.|कराची सुरुवातीची स्थिती निवडा.|कर की शुरुआती स्थिति चुनें।
This tax reference already exists in the Society.|या संस्थेत हा कर संदर्भ आधीच आहे.|इस संस्था में यह कर संदर्भ पहले से है।
Tax record not found.|कर नोंद सापडली नाही.|कर रिकॉर्ड नहीं मिला।
Tax events must not precede the record or its latest event date.|करातील बदलाची तारीख मूळ नोंद किंवा शेवटच्या बदलापूर्वी नसावी.|कर बदलाव की तारीख मूल रिकॉर्ड या आखिरी बदलाव से पहले नहीं हो सकती।
Credit exceeds the recorded expected amount. Use a documented adjustment for a confirmed difference.|जमा कर अपेक्षित रकमेपेक्षा जास्त आहे. खात्री केलेल्या फरकासाठी कारणासह दुरुस्ती नोंदवा.|कर क्रेडिट अनुमानित रकम से अधिक है। पक्के अंतर के लिए कारण सहित सुधार दर्ज करें।
Tax event exceeds available tax credit.|करातील बदल उपलब्ध कर जमापेक्षा जास्त आहे.|कर बदलाव उपलब्ध कर क्रेडिट से अधिक है।
Resolve the tax dispute before recording set-off.|कराचा वापर नोंदवण्यापूर्वी वाद सोडवा.|कर का उपयोग दर्ज करने से पहले विवाद सुलझाएँ।
This event evidence reference already exists.|या बदलाच्या पुराव्याचा संदर्भ आधीच आहे.|इस बदलाव के सबूत का संदर्भ पहले से है।
Invalid tax event type.|कर बदलाचा योग्य प्रकार निवडा.|कर बदलाव का सही प्रकार चुनें।
Calculated tax is too large.|मोजलेला कर अॅपच्या मर्यादेपेक्षा जास्त आहे.|गिना गया कर ऐप की सीमा से अधिक है।
Tax totals exceed the supported range.|कराची बेरीज अॅपच्या मर्यादेपेक्षा जास्त आहे.|कर का जोड़ ऐप की सीमा से अधिक है।
Select a valid reporting period.|अहवालासाठी योग्य कालावधी निवडा.|रिपोर्ट के लिए सही समय चुनें।
Enter a financial-year start between 1900 and 9998.|आर्थिक वर्षाची सुरुवात १९०० ते ९९९८ या वर्षांत भरा.|वित्त वर्ष की शुरुआत १९०० से ९९९८ के बीच भरें।
From must not follow To.|सुरुवातीची तारीख शेवटच्या तारखेनंतर नसावी.|शुरू तारीख आखिरी तारीख के बाद नहीं हो सकती।
Minimum amount must not exceed maximum.|किमान रक्कम कमाल रकमेपेक्षा जास्त नसावी.|न्यूनतम रकम अधिकतम रकम से ज़्यादा नहीं हो सकती।
Report total exceeds the supported monetary range.|अहवालाची बेरीज अॅपच्या मर्यादेपेक्षा जास्त आहे.|रिपोर्ट का जोड़ ऐप की सीमा से अधिक है।
Posted Payment ID not found.|हिशोबात नोंदलेला पेमेंट क्रमांक सापडला नाही.|हिसाब में दर्ज पेमेंट नंबर नहीं मिला।
Bank summaries support Society, bank and period filters only.|बँक आढाव्यासाठी फक्त संस्था, बँक आणि कालावधी निवडता येतो.|बैंक सार के लिए केवल संस्था, बैंक और समय चुन सकते हैं।
Project summaries support Society, department, project, bank, period and text filters.|कामाच्या आढाव्यासाठी संस्था, विभाग, काम, बँक, कालावधी आणि शोध वापरा.|काम के सार के लिए संस्था, विभाग, काम, बैंक, समय और खोज लें।
Reconciliation supports Society, bank, period, status, text and amount filters.|जुळवणीसाठी संस्था, बँक, कालावधी, स्थिती, शोध आणि रक्कम निवडा.|मिलान के लिए संस्था, बैंक, समय, स्थिति, खोज और रकम चुनें।
Unknown {0} filter.|{0} ची निवड योग्य नाही.|{0} का चुनाव सही नहीं है।
Unknown report.|हा अहवाल उपलब्ध नाही.|यह रिपोर्ट उपलब्ध नहीं है।
Something went wrong. Try again or restart the local workspace.|काहीतरी अडचण आली. पुन्हा प्रयत्न करा किंवा FundTrace पुन्हा सुरू करा.|कुछ परेशानी हुई। फिर कोशिश करें या FundTrace फिर चालू करें।
Automatic backup failed. Check free disk space and folder permissions, then create a backup here.|आपोआप बॅकअप झाला नाही. मोकळी जागा आणि फोल्डरची परवानगी तपासा, मग इथे बॅकअप करा.|अपने आप बैकअप नहीं हुआ। खाली जगह और फ़ोल्डर की अनुमति जाँचें, फिर यहाँ बैकअप बनाएँ।
Confirm that backup folders contain private financial records and their encryption key.|बॅकअपमध्ये खाजगी हिशोब आणि तो उघडण्याची किल्ली आहे, हे समजल्याची खात्री करा.|पुष्टि करें कि बैकअप में निजी हिसाब और उसे खोलने की कुंजी होती है।
Select a worksheet.|शीट निवडा.|शीट चुनें।
Split worksheets longer than 2,000 data rows before importing.|२,००० पेक्षा जास्त ओळी असलेली शीट आधी लहान भागांत विभागा.|२,००० से अधिक पंक्तियों वाली शीट पहले छोटे हिस्सों में बाँटें।
Use a header row and between 1 and 2,000 data rows.|पहिल्या ओळीत नावे आणि पुढे १ ते २,००० माहितीच्या ओळी ठेवा.|पहली पंक्ति में नाम और आगे १ से २,००० जानकारी की पंक्तियाँ रखें।
Could not read this statement: {0}|हे स्टेटमेंट वाचता आले नाही: {0}|यह स्टेटमेंट पढ़ा नहीं गया: {0}
Request is too large.|माहितीचा आकार खूप मोठा आहे. लहान फाइल किंवा कमी ओळी वापरा.|जानकारी बहुत बड़ी है। छोटी फ़ाइल या कम पंक्तियाँ लें।
Use the local FundTrace interface.|या संगणकावरील FundTrace पान वापरा.|इस कंप्यूटर का FundTrace पेज इस्तेमाल करें।
Only local workspace requests are allowed.|फक्त याच संगणकावरून काम करता येते.|केवल इसी कंप्यूटर से काम कर सकते हैं।
Request origin is not allowed.|या पानावरून कृती करता येत नाही. FundTrace चे स्थानिक पान उघडा.|इस पेज से कार्रवाई नहीं हो सकती। FundTrace का स्थानीय पेज खोलें।
Cross-site requests are not allowed.|दुसऱ्या वेबसाइटवरून कृती करता येत नाही.|दूसरी वेबसाइट से कार्रवाई नहीं हो सकती।
Page not found.|पान सापडले नाही.|पेज नहीं मिला।
Endpoint not found.|मागितलेली कृती उपलब्ध नाही.|माँगी गई कार्रवाई उपलब्ध नहीं है।
Unknown export format.|फाइलचा हा प्रकार उपलब्ध नाही.|यह फ़ाइल प्रकार उपलब्ध नहीं है।
Select a valid status.|योग्य स्थिती निवडा.|सही स्थिति चुनें।
Invalid statement row.|स्टेटमेंटच्या ओळीत चुकीची माहिती आहे.|स्टेटमेंट की पंक्ति में गलत जानकारी है।
Unknown claim action.|बिलासाठी ही कृती उपलब्ध नाही.|बिल के लिए यह कार्रवाई उपलब्ध नहीं है।
Unknown reversal type.|उलट नोंदीचा हा प्रकार उपलब्ध नाही.|उलटी एंट्री का यह प्रकार उपलब्ध नहीं है।
Unknown master type.|मुख्य नोंदीचा हा प्रकार उपलब्ध नाही.|मुख्य रिकॉर्ड का यह प्रकार उपलब्ध नहीं है।
Invalid JSON request.|माहिती योग्य स्वरूपात आली नाही. पान पुन्हा उघडा.|जानकारी सही रूप में नहीं आई। पेज फिर खोलें।
Use JSON requests.|माहिती पाठवण्यासाठी FundTrace चे पान वापरा.|जानकारी भेजने के लिए FundTrace का पेज इस्तेमाल करें।
Use a JSON object.|माहिती योग्य स्वरूपात पाठवा.|जानकारी सही रूप में भेजें।
Record must be an object.|नोंदीची माहिती योग्य स्वरूपात नाही.|रिकॉर्ड की जानकारी सही रूप में नहीं है।
Method not allowed.|ही पद्धत वापरता येत नाही.|यह तरीका इस्तेमाल नहीं कर सकते।
Source evidence must be base64.|पुराव्याची फाइल योग्य स्वरूपात जोडा.|सबूत की फ़ाइल सही रूप में जोड़ें।
Bank movement date|बँकेतील व्यवहाराची तारीख|बैंक में लेनदेन की तारीख
Bank reference|बँकेचा संदर्भ क्रमांक|बैंक का संदर्भ नंबर
Name|नाव|नाम
Email|ईमेल|ईमेल
Effective date|लागू होण्याची तारीख|लागू होने की तारीख
Opening date|सुरुवातीची तारीख|शुरू की तारीख
Edit claim|देय बिल बदला|देय बिल बदलें
Edit payment|देयक बदला|भुगतान बदलें
Allow browser storage to save your language.|भाषा जतन करण्यासाठी ब्राउझरमध्ये माहिती साठवण्याची परवानगी द्या.|भाषा सेव करने के लिए ब्राउज़र में जानकारी रखने की अनुमति दें।
Bill|बिल|बिल
Event|कृती|कार्रवाई
Gross|एकूण रक्कम|कुल रकम
Maintain suppliers, contractors and labourers.|पुरवठादार, कंत्राटदार आणि कामगारांची माहिती ठेवा.|सप्लायर, ठेकेदार और मज़दूरों की जानकारी रखें।
Mode|पद्धत|तरीका
Payment ID|देयकाचा क्रमांक|भुगतान का नंबर
Rate %|दर %|दर %
Credit|जमा|जमा
Initial tax record|कराची पहिली नोंद|कर का पहला रिकॉर्ड
distribution|वाटप|बँटवारा
allocation|निधी वाटप|रकम का बँटवारा
Choose a verified backup folder|तपासलेली बॅकअप प्रत असलेले फोल्डर निवडा|जाँची गई बैकअप कॉपी का फ़ोल्डर चुनें
Restore backup|बॅकअपमधून नोंदी परत आणा|बैकअप से रिकॉर्ड वापस लाएँ
Replace this workspace with the selected backup?|निवडलेल्या बॅकअपमधून या जागी नोंदी परत आणायच्या का?|चुने गए बैकअप से यहाँ के रिकॉर्ड बदलने हैं?
Backup date|बॅकअपची तारीख|बैकअप की तारीख
Your current workspace is retained. Changes after this backup will not be included.|आताच्या नोंदींचे फोल्डर सुरक्षित ठेवले जाईल. बॅकअपनंतरचे बदल परत आलेल्या नोंदींमध्ये नसतील.|अभी के रिकॉर्ड का फ़ोल्डर सुरक्षित रहेगा। बैकअप के बाद के बदलाव वापस आए रिकॉर्ड में नहीं होंगे।
Could not restore backup|बॅकअपमधून नोंदी परत आणता आल्या नाहीत|बैकअप से रिकॉर्ड वापस नहीं आ सके
Exit|बंद करा|बंद करें
View|दाखवा|देखें
Undo|मागचा बदल रद्द करा|पिछला बदलाव हटाएँ
Redo|बदल पुन्हा करा|बदलाव फिर करें
Cut|कापा|काटें
Copy|प्रत करा|कॉपी करें
Paste|चिकटवा|पेस्ट करें
Select all|सर्व निवडा|सब चुनें
Reload|पान पुन्हा उघडा|पेज फिर खोलें
Zoom in|मोठे दाखवा|बड़ा दिखाएँ
Zoom out|लहान दाखवा|छोटा दिखाएँ
Actual size|मूळ आकार|असली आकार
Full screen|पूर्ण पडदा|पूरी स्क्रीन
Save file|फाइल जतन करा|फ़ाइल सेव करें
Save PDF|PDF जतन करा|PDF सेव करें
PDF saved locally.|PDF या संगणकावर जतन केला.|PDF इस कंप्यूटर पर सेव किया।
PDF save cancelled.|PDF जतन करणे रद्द केले.|PDF सेव करना रद्द किया।
Exports include all filtered rows. Choose where to save your PDF on this computer.|डाउनलोडमध्ये निवडलेल्या सर्व नोंदी येतात. PDF या संगणकावर कुठे जतन करायचा ते निवडा.|डाउनलोड में चुने सभी रिकॉर्ड आते हैं। PDF इस कंप्यूटर पर कहाँ सेव करना है, वह चुनें।
This choice is saved in this app and works without internet.|ही निवड या अॅपमध्ये जतन होते आणि इंटरनेटशिवाय चालते.|यह चुनाव इस ऐप में सेव होता है और बिना इंटरनेट काम करता है।
Could not open the workspace|कामाच्या नोंदी उघडता आल्या नाहीत|काम के रिकॉर्ड नहीं खुल पाए
Unlock after a crash|अचानक बंद झाल्यानंतरचे लॉक काढा|अचानक बंद होने के बाद का लॉक हटाएँ
Use the FundTrace menu at the top of this window and choose Restore backup. Select your dated backup folder, check its date and confirm. The app restarts with the restored records.|या खिडकीच्या वरच्या FundTrace मेनूमधून बॅकअपमधून नोंदी परत आणा निवडा. बॅकअपचे फोल्डर निवडा, तारीख तपासा आणि खात्री करा. अॅप परत आणलेल्या नोंदींसह पुन्हा उघडेल.|इस विंडो के ऊपर FundTrace मेनू में बैकअप से रिकॉर्ड वापस लाएँ चुनें। बैकअप का फ़ोल्डर चुनें, तारीख जाँचें और पुष्टि करें। ऐप वापस आए रिकॉर्ड के साथ फिर खुलेगा।
Restart FundTrace. If a stopped process left a lock, choose Unlock after a crash in the startup message. A running process cannot be unlocked.|FundTrace पुन्हा उघडा. बंद झालेल्या अॅपचे लॉक राहिले असेल तर सुरुवातीच्या संदेशात अचानक बंद झाल्यानंतरचे लॉक काढा निवडा. चालू अॅपचे लॉक काढता येत नाही.|FundTrace फिर खोलें। बंद ऐप का लॉक बचा हो तो शुरू के संदेश में अचानक बंद होने के बाद का लॉक हटाएँ चुनें। चालू ऐप का लॉक नहीं हट सकता।
`
    .trim()
    .split("\n")
    .map((line) => {
      const [key, mr, hi] = line.split("|");
      return [key, [mr, hi]];
    }),
);
