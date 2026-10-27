/**
 * ========================================================
 * VOCABMASTER - DICTIONARY & AUTOCOMPLETE ENGINE (DICTIONARY.JS)
 * Comprehensive dataset of IELTS Vocabulary, Phrasal Verbs,
 * Idioms, Collocations, Phrases with online API fallback.
 * Strictly conforms to 13 IELTS Word Types in API_CONTRACT.md §11
 * ========================================================
 */

export const DICTIONARY_DATABASE = [
  // ======================================================
  // 1. IDIOMS (THÀNH NGỮ)
  // ======================================================
  {
    word: 'piece of cake',
    meaning: 'dễ như ăn cháo, rất dễ dàng',
    type: 'idiom',
    phonetic: '/ˌpiːs əv ˈkeɪk/',
    example: 'The final exam was a piece of cake for him.',
    exampleVi: 'Bài kiểm tra cuối kỳ đối với anh ấy dễ như ăn cháo.'
  },
  {
    word: 'break a leg',
    meaning: 'chúc may mắn (trong biểu diễn, thi cử)',
    type: 'idiom',
    phonetic: '/ˌbreɪk ə ˈleɡ/',
    example: 'Break a leg at your presentation today!',
    exampleVi: 'Chúc bài thuyết trình hôm nay của bạn thành công rực rỡ nhé!'
  },
  {
    word: 'bite the bullet',
    meaning: 'cắn răng chịu đựng, dũng cảm đối mặt khó khăn',
    type: 'idiom',
    phonetic: '/ˌbaɪt ðə ˈbʊl.ɪt/',
    example: 'I decided to bite the bullet and talk to my boss about the issue.',
    exampleVi: 'Tôi quyết định cắn răng đối mặt và nói chuyện với sếp về vấn đề đó.'
  },
  {
    word: 'burn the midnight oil',
    meaning: 'thức khuya học tập hoặc làm việc cật lực',
    type: 'idiom',
    phonetic: '/ˌbɜːn ðə ˌmɪd.naɪt ˈɔɪl/',
    example: 'She had to burn the midnight oil to prepare for the IELTS exam.',
    exampleVi: 'Cô ấy đã phải thức khuya miệt mài để chuẩn bị cho kỳ thi IELTS.'
  },
  {
    word: 'cost an arm and a leg',
    meaning: 'cực kỳ đắt đỏ, tốn kém',
    type: 'idiom',
    phonetic: '/kɒst ən ˈɑːm ənd ə ˈleɡ/',
    example: 'Buying a brand new car in this city costs an arm and a leg.',
    exampleVi: 'Mua một chiếc xe hơi mới toanh ở thành phố này đắt cắt cổ.'
  },
  {
    word: 'once in a blue moon',
    meaning: 'hiếm khi, năm thì mười họa mới xảy ra',
    type: 'idiom',
    phonetic: '/ˌwʌns ɪn ə ˌbluː ˈmuːn/',
    example: 'He only visits his hometown once in a blue moon.',
    exampleVi: 'Anh ấy hiếm khi mới về thăm quê một lần.'
  },
  {
    word: 'under the weather',
    meaning: 'cảm thấy không khỏe, mệt mỏi trong người',
    type: 'idiom',
    phonetic: '/ˌʌn.də ðə ˈweð.ər/',
    example: 'I am feeling a bit under the weather today, so I stayed home.',
    exampleVi: 'Hôm nay tôi thấy trong người hơi khó chịu nên ở nhà nghỉ ngơi.'
  },
  {
    word: 'spill the beans',
    meaning: 'tiết lộ bí mật, làm lộ chuyện',
    type: 'idiom',
    phonetic: '/ˌspɪl ðə ˈbiːnz/',
    example: 'Trust him with your secret; he will never spill the beans.',
    exampleVi: 'Hãy tin tưởng tâm sự với anh ấy; anh ấy sẽ không bao giờ làm lộ bí mật đâu.'
  },
  {
    word: 'hit the nail on the head',
    meaning: 'nói trúng phóc, chỉ ra điểm mấu chốt một cách chính xác',
    type: 'idiom',
    phonetic: '/ˌhɪt ðə ˌneɪl ɒn ðə ˈhed/',
    example: 'Her analysis hit the nail on the head regarding our market drop.',
    exampleVi: 'Phân tích của cô ấy đã nói trúng phóc nguyên nhân sụt giảm thị trường.'
  },
  {
    word: 'see eye to eye',
    meaning: 'đồng tình, có cùng quan điểm với nhau',
    type: 'idiom',
    phonetic: '/ˌsiː ˌaɪ tu ˈaɪ/',
    example: 'The two partners do not always see eye to eye on business strategies.',
    exampleVi: 'Hai đối tác không phải lúc nào cũng cùng chung quan điểm về chiến lược kinh doanh.'
  },
  {
    word: 'a blessing in disguise',
    meaning: 'trong cái rủi có cái may',
    type: 'idiom',
    phonetic: '/ə ˌbles.ɪŋ ɪn dɪsˈɡaɪz/',
    example: 'Losing that job turned out to be a blessing in disguise.',
    exampleVi: 'Việc mất công việc đó hóa ra lại là điều may mắn trong cái rủi.'
  },
  {
    word: 'beat around the bush',
    meaning: 'vòng vo tam quốc, không nói thẳng vào vấn đề',
    type: 'idiom',
    phonetic: '/ˌbiːt əˌraʊnd ðə ˈbʊʃ/',
    example: 'Stop beating around the bush and tell me what really happened.',
    exampleVi: 'Đừng nói vòng vo nữa, hãy cho tôi biết điều gì thực sự đã xảy ra.'
  },
  {
    word: 'call it a day',
    meaning: 'kết thúc công việc của một ngày, nghỉ tay',
    type: 'idiom',
    phonetic: '/ˌkɔːl ɪt ə ˈdeɪ/',
    example: 'We have accomplished so much today, let us call it a day.',
    exampleVi: 'Hôm nay chúng ta đã hoàn thành được nhiều việc rồi, hãy nghỉ tay thôi.'
  },
  {
    word: 'cut corners',
    meaning: 'làm ẩu, đi tắt đốt cháy giai đoạn để tiết kiệm thời gian hoặc tiền bạc',
    type: 'idiom',
    phonetic: '/ˌkʌt ˈkɔː.nəz/',
    example: 'Never cut corners when it comes to construction safety.',
    exampleVi: 'Tuyệt đối không được làm ẩu khi liên quan đến an toàn xây dựng.'
  },
  {
    word: 'get out of hand',
    meaning: 'mất kiểm soát, vượt khỏi tầm tay',
    type: 'idiom',
    phonetic: '/ˌɡet aʊt əv ˈhænd/',
    example: 'The discussion quickly got out of hand as tempers flared.',
    exampleVi: 'Cuộc tranh luận nhanh chóng mất kiểm soát khi mọi người nổi nóng.'
  },
  {
    word: 'hang in there',
    meaning: 'kiên trì, cố gắng đừng bỏ cuộc',
    type: 'idiom',
    phonetic: '/ˌhæŋ ɪn ˈðeər/',
    example: 'Hang in there! Your hard work will definitely pay off.',
    exampleVi: 'Hãy kiên trì lên! Sự chăm chỉ của bạn chắc chắn sẽ được đền đáp.'
  },
  {
    word: 'pull someone\'s leg',
    meaning: 'trêu chọc, đùa giỡn ai đó',
    type: 'idiom',
    phonetic: '/ˌpʊl sʌm.wʌnz ˈleɡ/',
    example: 'Don\'t take him seriously, he was just pulling your leg.',
    exampleVi: 'Đừng nghiêm túc quá, anh ấy chỉ đang trêu bạn chút thôi.'
  },
  {
    word: 'so far so good',
    meaning: 'mọi chuyện đến giờ vẫn ổn thỏa',
    type: 'idiom',
    phonetic: '/ˌsəʊ fɑː səʊ ˈɡʊd/',
    example: 'How is the new project going? - So far so good!',
    exampleVi: 'Dự án mới tiến triển thế nào rồi? - Đến giờ mọi chuyện vẫn rất ổn thỏa!'
  },
  {
    word: 'speak of the devil',
    meaning: 'vừa nhắc tào tháo thì tào tháo đến',
    type: 'idiom',
    phonetic: '/ˌspiːk əv ðə ˈdev.əl/',
    example: 'Speak of the devil! We were just talking about you.',
    exampleVi: 'Vừa nhắc tào tháo là đến ngay! Chúng tôi vừa mới nói về bạn xong.'
  },
  {
    word: 'the best of both worlds',
    meaning: 'vẹn cả đôi đường, được lợi từ cả hai phía',
    type: 'idiom',
    phonetic: '/ðə ˌbest əv ˌbəʊθ ˈwɜːldz/',
    example: 'Working remotely gives you the best of both worlds.',
    exampleVi: 'Làm việc từ xa giúp bạn có được lợi ích vẹn cả đôi đường.'
  },
  {
    word: 'time flies',
    meaning: 'thời gian thấm thoát thoi đưa',
    type: 'idiom',
    phonetic: '/ˌtaɪm ˈflaɪz/',
    example: 'Time flies when you are having fun with close friends.',
    exampleVi: 'Thời gian trôi thật nhanh khi bạn vui vẻ bên những người bạn thân.'
  },
  {
    word: 'weather the storm',
    meaning: 'vượt qua giai đoạn sóng gió, kiên cường qua khó khăn',
    type: 'idiom',
    phonetic: '/ˌweð.ə ðə ˈstɔːm/',
    example: 'The startup managed to weather the financial storm.',
    exampleVi: 'Công ty khởi nghiệp đã nỗ lực vượt qua cơn sóng gió tài chính.'
  },
  {
    word: 'hit the books',
    meaning: 'cắm đầu vào học, ôn bài chăm chỉ',
    type: 'idiom',
    phonetic: '/ˌhɪt ðə ˈbʊks/',
    example: 'I have an exam tomorrow morning, so I must hit the books tonight.',
    exampleVi: 'Sáng mai tôi có bài thi rồi, nên tối nay phải cắm đầu vào học thôi.'
  },
  {
    word: 'kill two birds with one stone',
    meaning: 'một mũi tên trúng hai đích, một công đôi việc',
    type: 'idiom',
    phonetic: '/ˌkɪl tuː ˈbɜːdz wɪð wʌn ˈstəʊn/',
    example: 'Cycling to work kills two birds with one stone: saving money and getting exercise.',
    exampleVi: 'Đạp xe đi làm là một công đôi việc: vừa tiết kiệm tiền vừa rèn luyện sức khỏe.'
  },
  {
    word: 'let the cat out of the bag',
    meaning: 'vô tình để lộ bí mật',
    type: 'idiom',
    phonetic: '/ˌlet ðə ˈkæt aʊt əv ðə ˈbæɡ/',
    example: 'She let the cat out of the bag about the surprise birthday party.',
    exampleVi: 'Cô ấy đã vô tình làm lộ bí mật về bữa tiệc sinh nhật bất ngờ.'
  },
  {
    word: 'on the fence',
    meaning: 'lưỡng lự, chưa đưa ra quyết định',
    type: 'idiom',
    phonetic: '/ˌɒn ðə ˈfens/',
    example: 'I am still on the fence about whether to study abroad.',
    exampleVi: 'Tôi vẫn đang lưỡng lự chưa quyết định xem có nên đi du học hay không.'
  },
  {
    word: 'take with a grain of salt',
    meaning: 'tiếp nhận thông tin một cách thận trọng, nửa tin nửa ngờ',
    type: 'idiom',
    phonetic: '/ˌteɪk wɪð ə ˈɡreɪn əv ˈsɒlt/',
    example: 'You should take online rumors with a grain of salt.',
    exampleVi: 'Bạn nên tiếp nhận những tin đồn trên mạng một cách thận trọng.'
  },
  {
    word: 'the ball is in your court',
    meaning: 'quyết định hay hành động tiếp theo thuộc về bạn',
    type: 'idiom',
    phonetic: '/ðə ˌbɔːl ɪz ɪn jɔː ˈkɔːt/',
    example: 'I have made my proposal; now the ball is in your court.',
    exampleVi: 'Tôi đã đưa ra đề xuất rồi; giờ quyết định thuộc về bạn.'
  },

  // ======================================================
  // 2. PHRASAL VERBS (CỤM ĐỘNG TỪ)
  // ======================================================
  {
    word: 'look forward to',
    meaning: 'trông mong, háo hức chờ đợi điều gì',
    type: 'phrasal verb',
    phonetic: '/lʊk ˈfɔː.wəd tuː/',
    example: 'I look forward to hearing from you soon.',
    exampleVi: 'Tôi rất mong sớm nhận được phản hồi từ bạn.'
  },
  {
    word: 'carry out',
    meaning: 'tiến hành, thực hiện (nghiên cứu, kế hoạch, nhiệm vụ)',
    type: 'phrasal verb',
    phonetic: '/ˈkær.i aʊt/',
    example: 'The research team carried out several experiments.',
    exampleVi: 'Nhóm nghiên cứu đã tiến hành nhiều thí nghiệm.'
  },
  {
    word: 'bring about',
    meaning: 'mang lại, gây ra, dẫn tới sự thay đổi',
    type: 'phrasal verb',
    phonetic: '/brɪŋ əˈbaʊt/',
    example: 'New technologies have brought about major social changes.',
    exampleVi: 'Công nghệ mới đã mang lại những thay đổi lớn cho xã hội.'
  },
  {
    word: 'come up with',
    meaning: 'nghĩ ra, nảy ra (ý tưởng, sáng kiến, giải pháp)',
    type: 'phrasal verb',
    phonetic: '/kʌm ʌp wɪð/',
    example: 'She came up with a brilliant idea for the marketing campaign.',
    exampleVi: 'Cô ấy đã nảy ra một ý tưởng xuất sắc cho chiến dịch tiếp thị.'
  },
  {
    word: 'figure out',
    meaning: 'hiểu ra, tìm ra cách giải quyết vấn đề',
    type: 'phrasal verb',
    phonetic: '/ˈfɪɡ.ər aʊt/',
    example: 'We need to figure out why the system crashed.',
    exampleVi: 'Chúng ta cần tìm hiểu lý do tại sao hệ thống lại bị sập.'
  },
  {
    word: 'give up',
    meaning: 'từ bỏ, buông xuôi',
    type: 'phrasal verb',
    phonetic: '/ɡɪv ʌp/',
    example: 'Never give up on your dreams no matter the obstacles.',
    exampleVi: 'Đừng bao giờ từ bỏ ước mơ của bạn bất kể trở ngại nào.'
  },
  {
    word: 'put off',
    meaning: 'hoãn lại, dời lại lịch hẹn',
    type: 'phrasal verb',
    phonetic: '/pʊt ɒf/',
    example: 'The meeting was put off until next Monday.',
    exampleVi: 'Cuộc họp đã bị hoãn lại cho tới thứ Hai tuần sau.'
  },
  {
    word: 'call off',
    meaning: 'hủy bỏ (sự kiện, chuyến bay, trận đấu)',
    type: 'phrasal verb',
    phonetic: '/kɔːl ɒf/',
    example: 'The outdoor concert was called off due to heavy rain.',
    exampleVi: 'Buổi hòa nhạc ngoài trời đã bị hủy vì mưa lớn.'
  },
  {
    word: 'turn down',
    meaning: 'từ chối (lời đề nghị, công việc) hoặc vặn nhỏ âm lượng',
    type: 'phrasal verb',
    phonetic: '/tɜːn daʊn/',
    example: 'He turned down the job offer because the salary was too low.',
    exampleVi: 'Anh ấy đã từ chối lời mời làm việc vì mức lương quá thấp.'
  },
  {
    word: 'break down',
    meaning: 'hỏng hóc (máy móc, xe cộ) hoặc suy sụp tinh thần',
    type: 'phrasal verb',
    phonetic: '/breɪk daʊn/',
    example: 'Our car broke down in the middle of the highway.',
    exampleVi: 'Xe hơi của chúng tôi bị hỏng ngay giữa đường cao tốc.'
  },
  {
    word: 'get along with',
    meaning: 'hòa thuận, có mối quan hệ tốt với ai',
    type: 'phrasal verb',
    phonetic: '/ɡet əˈlɒŋ wɪð/',
    example: 'Do you get along well with your new colleagues?',
    exampleVi: 'Bạn có hòa thuận tốt với các đồng nghiệp mới không?'
  },
  {
    word: 'run out of',
    meaning: 'hết sạch, cạn kiệt (tiền, thời gian, xăng dầu)',
    type: 'phrasal verb',
    phonetic: '/rʌn aʊt əv/',
    example: 'We are running out of time to complete the assignment.',
    exampleVi: 'Chúng ta sắp hết thời gian để hoàn thành bài tập rồi.'
  },
  {
    word: 'keep up with',
    meaning: 'bắt kịp, theo kịp tiến độ hoặc xu hướng',
    type: 'phrasal verb',
    phonetic: '/kiːp ʌp wɪð/',
    example: 'It is hard to keep up with the fast-evolving tech world.',
    exampleVi: 'Rất khó để bắt kịp thế giới công nghệ phát triển nhanh chóng.'
  },
  {
    word: 'stand out',
    meaning: 'nổi bật, vượt trội hơn người khác',
    type: 'phrasal verb',
    phonetic: '/stænd aʊt/',
    example: 'Her creative design truly stood out from the competition.',
    exampleVi: 'Thiết kế sáng tạo của cô ấy thực sự nổi bật giữa cuộc thi.'
  },
  {
    word: 'take care of',
    meaning: 'chăm sóc, đảm đương giải quyết việc gì',
    type: 'phrasal verb',
    phonetic: '/teɪk keər əv/',
    example: 'She takes great care of her younger siblings.',
    exampleVi: 'Cô ấy chăm sóc rất chu đáo cho các em của mình.'
  },
  {
    word: 'take over',
    meaning: 'tiếp quản, nắm quyền kiểm soát',
    type: 'phrasal verb',
    phonetic: '/teɪk ˈəʊ.vər/',
    example: 'The multinational corporation took over the local company.',
    exampleVi: 'Tập đoàn đa quốc gia đã tiếp quản công ty địa phương.'
  },
  {
    word: 'point out',
    meaning: 'chỉ ra, lưu ý điểm quan trọng',
    type: 'phrasal verb',
    phonetic: '/pɔɪnt aʊt/',
    example: 'The teacher pointed out several errors in my essay.',
    exampleVi: 'Giáo viên đã chỉ ra một vài lỗi sai trong bài luận của tôi.'
  },
  {
    word: 'set up',
    meaning: 'thành lập, thiết lập, dựng lên (hệ thống, doanh nghiệp)',
    type: 'phrasal verb',
    phonetic: '/set ʌp/',
    example: 'They set up an online community for English learners.',
    exampleVi: 'Họ đã thành lập một cộng đồng mạng cho người học tiếng Anh.'
  },
  {
    word: 'look into',
    meaning: 'điều tra, nghiên cứu kỹ lưỡng vấn đề',
    type: 'phrasal verb',
    phonetic: '/lʊk ˈɪn.tuː/',
    example: 'The authorities promised to look into the complaints.',
    exampleVi: 'Chính quyền đã hứa sẽ điều tra kỹ các khiếu nại.'
  },
  {
    word: 'deal with',
    meaning: 'giải quyết, đối phó với khó khăn hoặc tình huống',
    type: 'phrasal verb',
    phonetic: '/diːl wɪð/',
    example: 'A manager must know how to deal with stressful situations.',
    exampleVi: 'Một người quản lý phải biết cách giải quyết các tình huống căng thẳng.'
  },

  // ======================================================
  // 3. COLLOCATIONS (CỤM KẾT HỢP TỪ)
  // ======================================================
  {
    word: 'make a decision',
    meaning: 'đưa ra quyết định',
    type: 'collocation',
    phonetic: '/meɪk ə dɪˈsɪʒ.ən/',
    example: 'Take your time before you make an important career decision.',
    exampleVi: 'Hãy suy nghĩ kỹ trước khi đưa ra quyết định nghề nghiệp quan trọng.'
  },
  {
    word: 'bear in mind',
    meaning: 'ghi nhớ trong lòng, luôn nhớ rằng',
    type: 'collocation',
    phonetic: '/beər ɪn maɪnd/',
    example: 'Please bear in mind that deadlines are strictly enforced.',
    exampleVi: 'Xin hãy ghi nhớ rằng hạn chót được thực thi rất nghiêm ngặt.'
  },
  {
    word: 'pay attention to',
    meaning: 'chú ý, tập trung quan sát vào điều gì',
    type: 'collocation',
    phonetic: '/peɪ əˈten.ʃən tuː/',
    example: 'Students need to pay close attention to grammar details.',
    exampleVi: 'Học sinh cần chú ý kỹ đến các chi tiết ngữ pháp.'
  },
  {
    word: 'gain momentum',
    meaning: 'tạo được đà phát triển, ngày càng phổ biến và mạnh mẽ',
    type: 'collocation',
    phonetic: '/ɡeɪn məˈmen.təm/',
    example: 'The green energy movement is gaining momentum globally.',
    exampleVi: 'Phong trào năng lượng xanh đang tạo được đà phát triển mạnh mẽ trên toàn cầu.'
  },
  {
    word: 'reach a consensus',
    meaning: 'đạt được sự đồng thuận, nhất trí chung',
    type: 'collocation',
    phonetic: '/riːtʃ ə kənˈsen.səs/',
    example: 'The board members struggled to reach a consensus on budget allocation.',
    exampleVi: 'Các thành viên hội đồng gặp khó khăn để đạt được sự đồng thuận về phân bổ ngân sách.'
  },
  {
    word: 'bridge the gap',
    meaning: 'thu hẹp khoảng cách (văn hóa, giàu nghèo, công nghệ)',
    type: 'collocation',
    phonetic: '/brɪdʒ ðə ɡæp/',
    example: 'Education is essential to bridge the gap between rich and poor.',
    exampleVi: 'Giáo dục là yếu tố cốt lõi để thu hẹp khoảng cách giàu nghèo.'
  },
  {
    word: 'shed light on',
    meaning: 'làm sáng tỏ, giải thích rõ ràng điều gì',
    type: 'collocation',
    phonetic: '/ʃed laɪt ɒn/',
    example: 'Recent scientific findings shed light on human brain function.',
    exampleVi: 'Những phát hiện khoa học gần đây đã làm sáng tỏ chức năng não bộ con người.'
  },
  {
    word: 'draw conclusions',
    meaning: 'rút ra kết luận từ bằng chứng thực tế',
    type: 'collocation',
    phonetic: '/drɔː kənˈkluː.ʒənz/',
    example: 'It is too early to draw definitive conclusions from the survey.',
    exampleVi: 'Còn quá sớm để rút ra các kết luận chắc chắn từ cuộc khảo sát.'
  },
  {
    word: 'have an impact on',
    meaning: 'có tác động, ảnh hưởng sâu sắc đến',
    type: 'collocation',
    phonetic: '/hæv ən ˈɪm.pækt ɒn/',
    example: 'Air pollution has a detrimental impact on public health.',
    exampleVi: 'Ô nhiễm không khí có tác động tiêu cực đến sức khỏe cộng đồng.'
  },
  {
    word: 'pose a threat to',
    meaning: 'gây ra mối đe dọa, nguy cơ cho',
    type: 'collocation',
    phonetic: '/pəʊz ə θret tuː/',
    example: 'Cyberattacks pose a serious threat to national security.',
    exampleVi: 'Các cuộc tấn công mạng gây ra mối đe dọa nghiêm trọng cho an ninh quốc gia.'
  },
  {
    word: 'take advantage of',
    meaning: 'tận dụng cơ hội, hoặc lợi dụng ai đó',
    type: 'collocation',
    phonetic: '/teɪk ədˈvɑːn.tɪdʒ əv/',
    example: 'You should take full advantage of this scholarship opportunity.',
    exampleVi: 'Bạn nên tận dụng tối đa cơ hội học bổng quý giá này.'
  },
  {
    word: 'make progress',
    meaning: 'đạt được tiến bộ, tiến triển tốt',
    type: 'collocation',
    phonetic: '/meɪk ˈprəʊ.ɡres/',
    example: 'He has made tremendous progress in his English speaking skills.',
    exampleVi: 'Anh ấy đã có sự tiến bộ vượt bậc trong kỹ năng nói tiếng Anh.'
  },
  {
    word: 'raise awareness',
    meaning: 'nâng cao nhận thức của cộng đồng',
    type: 'collocation',
    phonetic: '/reɪz əˈweə.nəs/',
    example: 'The campaign aims to raise public awareness about plastic waste.',
    exampleVi: 'Chiến dịch nhằm nâng cao nhận thức cộng đồng về rác thải nhựa.'
  },
  {
    word: 'tackle an issue',
    meaning: 'giải quyết, xử lý một vấn đề nan giải',
    type: 'collocation',
    phonetic: '/ˈtæk.əl ən ˈɪʃ.uː/',
    example: 'Governments worldwide must collaborate to tackle climate issues.',
    exampleVi: 'Chính phủ các nước trên thế giới phải hợp tác để xử lý các vấn đề khí hậu.'
  },
  {
    word: 'meet the deadline',
    meaning: 'kịp thời hạn, đúng hạn chót',
    type: 'collocation',
    phonetic: '/miːt ðə ˈded.laɪn/',
    example: 'We worked overtime to ensure we met the project deadline.',
    exampleVi: 'Chúng tôi đã làm thêm giờ để đảm bảo kịp hạn chót của dự án.'
  },
  {
    word: 'strike a balance',
    meaning: 'tìm điểm cân bằng, giữ sự cân bằng hài hòa',
    type: 'collocation',
    phonetic: '/straɪk ə ˈbæl.əns/',
    example: 'It is vital to strike a balance between career ambition and family life.',
    exampleVi: 'Điều cốt yếu là phải giữ sự cân bằng giữa hoài bão sự nghiệp và đời sống gia đình.'
  },

  // ======================================================
  // 4. PHRASES (CỤM TỪ)
  // ======================================================
  {
    word: 'in terms of',
    meaning: 'xét về mặt, về phương diện',
    type: 'phrase',
    phonetic: '/ɪn tɜːmz əv/',
    example: 'In terms of cost efficiency, renewable energy is a sound investment.',
    exampleVi: 'Xét về mặt hiệu quả chi phí, năng lượng tái tạo là một khoản đầu tư đúng đắn.'
  },
  {
    word: 'as a matter of fact',
    meaning: 'trên thực tế, thực ra là',
    type: 'phrase',
    phonetic: '/æz ə ˈmæt.ər əv fækt/',
    example: 'As a matter of fact, I have visited that museum twice already.',
    exampleVi: 'Thực ra là tôi đã từng đến thăm bảo tàng đó hai lần rồi.'
  },
  {
    word: 'take into account',
    meaning: 'xem xét, tính đến, cân nhắc các yếu tố',
    type: 'phrase',
    phonetic: '/teɪk ˈɪn.tuː əˈkaʊnt/',
    example: 'You must take local regulations into account before launching.',
    exampleVi: 'Bạn phải cân nhắc các quy định địa phương trước khi triển khai.'
  },
  {
    word: 'play a crucial role in',
    meaning: 'đóng vai trò tối quan trọng trong việc gì',
    type: 'phrase',
    phonetic: '/pleɪ ə ˈkruː.ʃəl rəʊl ɪn/',
    example: 'Early childhood education plays a crucial role in brain development.',
    exampleVi: 'Giáo dục mầm non đóng một vai trò tối quan trọng đối với sự phát triển não bộ.'
  },
  {
    word: 'on the other hand',
    meaning: 'mặt khác, ngược lại',
    type: 'phrase',
    phonetic: '/ɒn ðiː ˈʌð.ər hænd/',
    example: 'Online learning is flexible; on the other hand, it requires great discipline.',
    exampleVi: 'Học trực tuyến rất linh hoạt; mặt khác, nó đòi hỏi tính tự giác rất cao.'
  },
  {
    word: 'in contrast to',
    meaning: 'trái ngược hẳn với',
    type: 'phrase',
    phonetic: '/ɪn kənˈtrɑːst tuː/',
    example: 'In contrast to her outgoing sister, she is introverted and quiet.',
    exampleVi: 'Trái ngược với người chị hướng ngoại, cô ấy lại sống nội tâm và trầm lặng.'
  },
  {
    word: 'in spite of',
    meaning: 'mặc dù, bất chấp khó khăn',
    type: 'phrase',
    phonetic: '/ɪn spaɪt əv/',
    example: 'In spite of bad weather, the festival attracted thousands of visitors.',
    exampleVi: 'Bất chấp thời tiết xấu, lễ hội vẫn thu hút hàng ngàn du khách.'
  },
  {
    word: 'with regard to',
    meaning: 'liên quan tới, xét về khía cạnh',
    type: 'phrase',
    phonetic: '/wɪð rɪˈɡɑːd tuː/',
    example: 'With regard to the budget proposal, further review is required.',
    exampleVi: 'Liên quan tới đề xuất ngân sách, cần phải xem xét kỹ lưỡng hơn nữa.'
  },
  {
    word: 'in the long run',
    meaning: 'về lâu về dài, trong tương lai dài hạn',
    type: 'phrase',
    phonetic: '/ɪn ðə lɒŋ rʌn/',
    example: 'Investing in employee training always pays off in the long run.',
    exampleVi: 'Đầu tư vào đào tạo nhân viên luôn mang lại kết quả tốt về lâu về dài.'
  },
  {
    word: 'first and foremost',
    meaning: 'trước hết và quan trọng nhất',
    type: 'phrase',
    phonetic: '/ˌfɜːst ənd ˈfɔː.məʊst/',
    example: 'First and foremost, we must ensure user data privacy and security.',
    exampleVi: 'Trước hết và quan trọng nhất, chúng ta phải đảm bảo quyền riêng tư và an toàn dữ liệu người dùng.'
  },

  // ======================================================
  // 5. ACADEMIC & IELTS VOCABULARY (13 WORD TYPES)
  // ======================================================
  {
    word: 'sustainable',
    meaning: 'bền vững, thân thiện với môi trường',
    type: 'adjective',
    phonetic: '/səˈsteɪ.nə.bəl/',
    example: 'We must adopt sustainable energy sources to protect our planet.',
    exampleVi: 'Chúng ta phải áp dụng các nguồn năng lượng bền vững để bảo vệ hành tinh.'
  },
  {
    word: 'innovation',
    meaning: 'sự đổi mới, sáng kiến cải tiến',
    type: 'noun',
    phonetic: '/ˌɪn.əˈveɪ.ʃən/',
    example: 'Technological innovation drives economic growth and prosperity.',
    exampleVi: 'Đổi mới công nghệ thúc đẩy sự tăng trưởng kinh tế và thịnh vượng.'
  },
  {
    word: 'biodiversity',
    meaning: 'đa dạng sinh học',
    type: 'noun',
    phonetic: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/',
    example: 'Conserving forest biodiversity is critical for global ecology.',
    exampleVi: 'Bảo tồn đa dạng sinh học rừng là vô cùng quan trọng đối với hệ sinh thái toàn cầu.'
  },
  {
    word: 'comprehensive',
    meaning: 'toàn diện, bao quát mọi mặt',
    type: 'adjective',
    phonetic: '/ˌkɒm.prɪˈhen.sɪv/',
    example: 'The government published a comprehensive report on education reform.',
    exampleVi: 'Chính phủ đã công bố một báo cáo toàn diện về cải cách giáo dục.'
  },
  {
    word: 'mitigate',
    meaning: 'giảm nhẹ, xoa dịu, giảm bớt tác hại',
    type: 'verb',
    phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
    example: 'Urgent action is needed to mitigate the impacts of climate change.',
    exampleVi: 'Cần hành động khẩn cấp để giảm nhẹ các tác động của biến đổi khí hậu.'
  },
  {
    word: 'resilience',
    meaning: 'khả năng phục hồi, sự kiên cường vượt qua nghịch cảnh',
    type: 'noun',
    phonetic: '/rɪˈzɪl.jəns/',
    example: 'The local community demonstrated remarkable resilience after the flood.',
    exampleVi: 'Cộng đồng địa phương đã thể hiện sự kiên cường đáng nể sau trận lũ.'
  },
  {
    word: 'ubiquitous',
    meaning: 'phổ biến khắp nơi, có mặt ở mọi chốn',
    type: 'adjective',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    example: 'Smartphones have become ubiquitous in modern everyday life.',
    exampleVi: 'Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong đời sống hiện đại.'
  },
  {
    word: 'paradigm',
    meaning: 'mô hình mẫu, hệ hình tư duy',
    type: 'noun',
    phonetic: '/ˈpær.ə.daɪm/',
    example: 'AI is shifting the learning paradigm across educational institutions.',
    exampleVi: 'Trí tuệ nhân tạo đang chuyển dịch hệ hình học tập tại các cơ sở giáo dục.'
  },
  {
    word: 'deteriorate',
    meaning: 'xuống cấp, suy thoái, trở nên tồi tệ hơn',
    type: 'verb',
    phonetic: '/dɪˈtɪə.ri.ə.reɪt/',
    example: 'Air quality in major metropolises continues to deteriorate rapidly.',
    exampleVi: 'Chất lượng không khí tại các đô thị lớn tiếp tục suy thoái nhanh chóng.'
  },
  {
    word: 'alleviate',
    meaning: 'làm dịu bớt, xoa dịu (nỗi đau, sự nghèo khó)',
    type: 'verb',
    phonetic: '/əˈliː.vi.eɪt/',
    example: 'The charity initiative helps alleviate extreme poverty in remote areas.',
    exampleVi: 'Sáng kiến từ thiện giúp làm vơi bớt sự nghèo đói cùng cực ở các vùng sâu vùng xa.'
  },
  {
    word: 'exacerbate',
    meaning: 'làm trầm trọng thêm, làm xấu đi tình hình',
    type: 'verb',
    phonetic: '/ɪɡˈzæs.ə.beɪt/',
    example: 'Rising inflation will only exacerbate the existing financial crisis.',
    exampleVi: 'Lạm phát gia tăng sẽ chỉ làm trầm trọng thêm cuộc khủng hoảng tài chính hiện tại.'
  },
  {
    word: 'feasibility',
    meaning: 'tính khả thi, khả năng thực hiện thành công',
    type: 'noun',
    phonetic: '/ˌfiː.zəˈbɪl.ə.ti/',
    example: 'Engineers are currently testing the technical feasibility of the proposed bridge.',
    exampleVi: 'Các kỹ sư đang kiểm nghiệm tính khả thi kỹ thuật của cây cầu được đề xuất.'
  },
  {
    word: 'imperative',
    meaning: 'cấp bách, bắt buộc, tối quan trọng',
    type: 'adjective',
    phonetic: '/ɪmˈper.ə.tɪv/',
    example: 'It is imperative that we take immediate steps to halt pollution.',
    exampleVi: 'Một điều tối quan trọng là chúng ta phải hành động ngay lập tức để ngăn chặn ô nhiễm.'
  },
  {
    word: 'scrutinize',
    meaning: 'soi xét, kiểm tra kỹ lưỡng từng chi tiết',
    type: 'verb',
    phonetic: '/ˈskruː.tɪ.naɪz/',
    example: 'Auditors will carefully scrutinize every transaction in the financial ledger.',
    exampleVi: 'Các kiểm toán viên sẽ xem xét kỹ lưỡng từng giao dịch trong sổ sách tài chính.'
  },
  {
    word: 'prevalent',
    meaning: 'thịnh hành, rất phổ biến rộng rãi',
    type: 'adjective',
    phonetic: '/ˈprev.əl.ənt/',
    example: 'Remote working has become prevalent in the post-pandemic era.',
    exampleVi: 'Làm việc từ xa đã trở nên rất thịnh hành trong thời kỳ hậu đại dịch.'
  },
  {
    word: 'ambiguous',
    meaning: 'mơ hồ, nhập nhằng, có thể hiểu theo nhiều nghĩa',
    type: 'adjective',
    phonetic: '/æmˈbɪɡ.ju.əs/',
    example: 'The contractual terms were ambiguous and led to disputes.',
    exampleVi: 'Các điều khoản trong hợp đồng rất mơ hồ và đã dẫn tới những tranh chấp.'
  },
  {
    word: 'reluctance',
    meaning: 'sự miễn cưỡng, ngần ngại không muốn làm',
    type: 'noun',
    phonetic: '/rɪˈlʌk.təns/',
    example: 'She expressed deep reluctance to accept the overseas assignment.',
    exampleVi: 'Cô ấy bày tỏ sự ngần ngại sâu sắc khi nhận nhiệm vụ công tác nước ngoài.'
  },
  {
    word: 'subsequent',
    meaning: 'xảy ra sau đó, tiếp theo sau',
    type: 'adjective',
    phonetic: '/ˈsʌb.sɪ.kwənt/',
    example: 'Subsequent studies confirmed the original theory.',
    exampleVi: 'Các nghiên cứu tiếp theo sau đó đã chứng thực lý thuyết ban đầu.'
  },
  {
    word: 'unprecedented',
    meaning: 'chưa từng có tiền lệ, vô tiền khoáng hậu',
    type: 'adjective',
    phonetic: '/ʌnˈpres.ɪ.den.tɪd/',
    example: 'The country experienced unprecedented economic expansion this decade.',
    exampleVi: 'Quốc gia này đã trải qua sự mở rộng kinh tế chưa từng có tiền lệ trong thập kỷ này.'
  },
  {
    word: 'viable',
    meaning: 'khả thi, có thể tồn tại và phát triển độc lập',
    type: 'adjective',
    phonetic: '/ˈvaɪ.ə.bəl/',
    example: 'Solar energy has emerged as a commercially viable alternative.',
    exampleVi: 'Năng lượng mặt trời đã nổi lên như một giải pháp thay thế khả thi về mặt thương mại.'
  },
  {
    word: 'advocate',
    meaning: 'người ủng hộ hoặc tán thành, chủ trương',
    type: 'verb',
    phonetic: '/ˈæd.və.keɪt/',
    example: 'Environmentalists advocate stricter policies on industrial emissions.',
    exampleVi: 'Các nhà bảo vệ môi trường chủ trương đưa ra những chính sách nghiêm ngặt hơn về khí thải công nghiệp.'
  },
  {
    word: 'coherent',
    meaning: 'mạch lạc, chặt chẽ, dễ hiểu',
    type: 'adjective',
    phonetic: '/kəʊˈhɪə.rənt/',
    example: 'His argument was logically structured and remarkably coherent.',
    exampleVi: 'Lập luận của anh ấy được cấu trúc logic và vô cùng mạch lạc.'
  },
  {
    word: 'diligent',
    meaning: 'siêng năng, chăm chỉ, cần mẫn',
    type: 'adjective',
    phonetic: '/ˈdɪl.ɪ.dʒənt/',
    example: 'Diligent students usually attain exceptional academic results.',
    exampleVi: 'Những học sinh siêng năng thường đạt được kết quả học tập xuất sắc.'
  },
  {
    word: 'empathy',
    meaning: 'sự đồng cảm, thấu cảm tâm tư người khác',
    type: 'noun',
    phonetic: '/ˈem.pə.θi/',
    example: 'Empathy is a foundational quality of effective leaders.',
    exampleVi: 'Sự thấu cảm là một phẩm chất nền tảng của những nhà lãnh đạo hiệu quả.'
  },
  {
    word: 'fluctuate',
    meaning: 'dao động, biến động không ngừng',
    type: 'verb',
    phonetic: '/ˈflʌk.tʃu.eɪt/',
    example: 'Currency exchange rates fluctuate based on global trade dynamics.',
    exampleVi: 'Tỷ giá hối đoái tiền tệ dao động dựa trên các biến động thương mại toàn cầu.'
  },
  {
    word: 'hierarchy',
    meaning: 'hệ thống cấp bậc, thứ bậc quyền lực',
    type: 'noun',
    phonetic: '/ˈhaɪə.rɑː.ki/',
    example: 'The company flattened its corporate hierarchy to foster creativity.',
    exampleVi: 'Công ty đã tinh gọn hệ thống cấp bậc để thúc đẩy tính sáng tạo.'
  },
  {
    word: 'inevitable',
    meaning: 'không thể tránh khỏi, chắc chắn sẽ xảy ra',
    type: 'adjective',
    phonetic: '/ɪnˈev.ɪ.tə.bəl/',
    example: 'Change is an inevitable part of organizational growth.',
    exampleVi: 'Sự thay đổi là một phần tất yếu không thể tránh khỏi của sự phát triển tổ chức.'
  },
  {
    word: 'lucrative',
    meaning: 'sinh lợi nhiều, mang lại khoản lợi nhuận béo bở',
    type: 'adjective',
    phonetic: '/ˈluː.krə.tɪv/',
    example: 'Investing in real estate proved to be a highly lucrative venture.',
    exampleVi: 'Đầu tư vào bất động sản đã chứng tỏ là một thương vụ mang lại nhiều lợi nhuận.'
  },
  {
    word: 'meticulous',
    meaning: 'tỉ mỉ, cẩn thận, chăm chút từng chi tiết nhỏ',
    type: 'adjective',
    phonetic: '/məˈtɪk.jə.ləs/',
    example: 'The architect drew meticulous blueprints for the historical restoration.',
    exampleVi: 'Kiến trúc sư đã vẽ những bản thiết kế tỉ mỉ cho việc phục dựng di tích lịch sử.'
  },
  {
    word: 'noteworthy',
    meaning: 'đáng chú ý, đáng ghi nhận',
    type: 'adjective',
    phonetic: '/ˈnəʊtˌwɜː.ði/',
    example: 'The scientist made several noteworthy contributions to genetics.',
    exampleVi: 'Nhà khoa học đã có nhiều đóng góp đáng chú ý cho ngành di truyền học.'
  },
  {
    word: 'optimal',
    meaning: 'tối ưu, lý tưởng nhất',
    type: 'adjective',
    phonetic: '/ˈɒp.tɪ.məl/',
    example: 'The system was calibrated to deliver optimal performance under heavy loads.',
    exampleVi: 'Hệ thống đã được hiệu chuẩn để đạt hiệu suất tối ưu dưới tải trọng lớn.'
  },
  {
    word: 'pragmatic',
    meaning: 'thực dụng, coi trọng tính thực tế hơn lý thuyết',
    type: 'adjective',
    phonetic: '/præɡˈmæt.ɪk/',
    example: 'We adopted a pragmatic approach to solve the logistics bottleneck.',
    exampleVi: 'Chúng tôi đã áp dụng một cách tiếp cận thực tế để tháo gỡ điểm nghẽn hậu cần.'
  },
  {
    word: 'redundant',
    meaning: 'dư thừa, không cần thiết, bị sa thải do dư biên chế',
    type: 'adjective',
    phonetic: '/rɪˈdʌn.dənt/',
    example: 'Automation has rendered some manual tasks completely redundant.',
    exampleVi: 'Tự động hóa đã khiến cho một số công việc thủ công trở nên hoàn toàn dư thừa.'
  },
  {
    word: 'skeptical',
    meaning: 'hoài nghi, ngờ vực, không dễ tin',
    type: 'adjective',
    phonetic: '/ˈskep.tɪ.kəl/',
    example: 'Experts remained skeptical about the bold claims made by the startup.',
    exampleVi: 'Các chuyên gia vẫn hoài nghi về những tuyên bố táo bạo từ công ty khởi nghiệp.'
  },
  {
    word: 'tangible',
    meaning: 'hữu hình, rõ ràng, có thể chạm hoặc cảm nhận được',
    type: 'adjective',
    phonetic: '/ˈtæn.dʒə.bəl/',
    example: 'The new policy delivered tangible improvements to living standards.',
    exampleVi: 'Chính sách mới đã mang lại những cải thiện hữu hình rõ rệt cho mức sống.'
  },
  {
    word: 'versatile',
    meaning: 'linh hoạt, đa năng, thích ứng được nhiều vai trò',
    type: 'adjective',
    phonetic: '/ˈvɜː.sə.taɪl/',
    example: 'She is a versatile researcher skilled in both quantitative and qualitative methods.',
    exampleVi: 'Cô ấy là một nhà nghiên cứu đa năng, thành thạo cả phương pháp định lượng và định tính.'
  },
  {
    word: 'vulnerable',
    meaning: 'dễ bị tổn thương, mong manh trước nguy hiểm',
    type: 'adjective',
    phonetic: '/ˈvʌl.nər.ə.bəl/',
    example: 'Elderly citizens are particularly vulnerable to extreme winter weather.',
    exampleVi: 'Người cao tuổi đặc biệt dễ bị tổn thương trước thời tiết mùa đông khắc nghiệt.'
  },
  {
    word: 'collaborate',
    meaning: 'hợp tác, phối hợp làm việc chung',
    type: 'verb',
    phonetic: '/kəˈlæb.ə.reɪt/',
    example: 'Multiple international teams collaborate on biomedical research projects.',
    exampleVi: 'Nhiều nhóm nghiên cứu quốc tế đã cùng hợp tác trong các dự án y sinh.'
  },
  {
    word: 'facilitate',
    meaning: 'tạo điều kiện thuận lợi, làm cho việc gì trở nên dễ dàng',
    type: 'verb',
    phonetic: '/fəˈsɪl.ɪ.teɪt/',
    example: 'Modern digital platforms facilitate seamless communication.',
    exampleVi: 'Các nền tảng số hiện đại giúp tạo điều kiện giao tiếp liền mạch và thuận lợi.'
  },
  {
    word: 'stimulate',
    meaning: 'kích thích, khuyến khích sự phát triển hoặc hoạt động',
    type: 'verb',
    phonetic: '/ˈstɪm.jə.leɪt/',
    example: 'Tax cuts are designed to stimulate business investments.',
    exampleVi: 'Việc giảm thuế được thiết kế để kích thích đầu tư của các doanh nghiệp.'
  },
  {
    word: 'significantly',
    meaning: 'đáng kể, một cách rõ rệt',
    type: 'adverb',
    phonetic: '/sɪɡˈnɪf.ɪ.kənt.li/',
    example: 'Customer satisfaction has increased significantly this quarter.',
    exampleVi: 'Mức độ hài lòng của khách hàng đã tăng lên một cách đáng kể trong quý này.'
  },
  {
    word: 'furthermore',
    meaning: 'hơn nữa, thêm vào đó',
    type: 'conjunction',
    phonetic: '/ˌfɜː.ðəˈmɔːr/',
    example: 'The rent is very cheap; furthermore, the location is unbeatable.',
    exampleVi: 'Giá thuê rất rẻ; hơn nữa, vị trí địa lý lại đắc địa vô cùng.'
  },
  {
    word: 'consequently',
    meaning: 'kết quả là, do đó',
    type: 'adverb',
    phonetic: '/ˈkɒn.sɪ.kwənt.li/',
    example: 'He failed to attend the meetings; consequently, he was removed from the committee.',
    exampleVi: 'Anh ấy đã không tham dự các buổi họp; do đó, anh ấy đã bị đưa ra khỏi ủy ban.'
  },
  {
    word: 'ought to',
    meaning: 'nên, phải (chỉ bổn phận đạo đức)',
    type: 'modal verb',
    phonetic: '/ˈɔːt tuː/',
    example: 'We ought to treat our environment with greater respect.',
    exampleVi: 'Chúng ta nên đối xử với môi trường xung quanh với sự tôn trọng lớn hơn.'
  },
  {
    word: 'alas',
    meaning: 'than ôi, ôi chao (thán từ biểu thị tiếc nuối)',
    type: 'interjection',
    phonetic: '/əˈlæs/',
    example: 'Alas, our vacation has come to an end.',
    exampleVi: 'Than ôi, kỳ nghỉ tuyệt vời của chúng ta đã đi đến hồi kết thúc.'
  },
  {
    word: 'throughout',
    meaning: 'suốt, khắp nơi trong (không gian, thời gian)',
    type: 'preposition',
    phonetic: '/θruːˈaʊt/',
    example: 'The theme of perseverance echoes throughout the entire novel.',
    exampleVi: 'Chủ đề về sự kiên trì vang vọng xuyên suốt toàn bộ cuốn tiểu thuyết.'
  },
  {
    word: 'whomever',
    meaning: 'bất kỳ ai (đại từ tân ngữ trang trọng)',
    type: 'pronoun',
    phonetic: '/huːmˈev.ər/',
    example: 'You may award the scholarship to whomever qualifies best.',
    exampleVi: 'Bạn có thể trao học bổng cho bất cứ ai đạt đủ tiêu chuẩn tốt nhất.'
  },
  {
    word: 'whichever',
    meaning: 'bất kỳ cái nào, dù là cái nào',
    type: 'determiner',
    phonetic: '/wɪtʃˈev.ər/',
    example: 'Take whichever route avoids the peak-hour traffic.',
    exampleVi: 'Hãy chọn bất kỳ tuyến đường nào giúp tránh được ùn tắc giờ cao điểm.'
  }
];

/**
 * Remove Vietnamese accents/diacritics for flexible fuzzy matching
 */
function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Search the built-in database with smart ranking
 * @param {string} query
 * @param {Object} [options]
 * @param {number} [options.limit=8]
 * @param {Array} [options.extraCards=[]] Custom cards from current decks
 * @returns {Array} List of matched items
 */
export function searchDictionary(query, options = {}) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const limit = options.limit || 8;
  const extraCards = options.extraCards || [];
  const qNoTone = removeVietnameseTones(q);

  // Combine built-in dictionary with extra cards if any
  const pool = [...DICTIONARY_DATABASE];

  if (Array.isArray(extraCards) && extraCards.length > 0) {
    extraCards.forEach(c => {
      if (c && c.front && !pool.some(p => p.word.toLowerCase() === c.front.toLowerCase())) {
        pool.push({
          word: c.front,
          meaning: c.back || c.meaning || '',
          type: c.wordType || c.type || 'noun',
          phonetic: c.phonetic || '',
          example: c.example || '',
          exampleVi: c.exampleVi || ''
        });
      }
    });
  }

  const results = [];

  for (const item of pool) {
    const wordLower = item.word.toLowerCase();
    const meaningLower = (item.meaning || '').toLowerCase();
    const meaningNoTone = removeVietnameseTones(meaningLower);

    let score = 0;

    if (wordLower === q) {
      score = 100; // Exact match
    } else if (wordLower.startsWith(q)) {
      score = 80; // Prefix match
    } else if (wordLower.includes(' ' + q) || wordLower.includes('-' + q)) {
      score = 65; // Word boundary match inside idiom or phrase (e.g. 'cake' in 'piece of cake')
    } else if (wordLower.includes(q)) {
      score = 45; // Substring match
    } else if (meaningNoTone.includes(qNoTone) || meaningLower.includes(q)) {
      score = 30; // Meaning match (Vietnamese search)
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  // Sort by score descending, then shorter word length, then alphabetical
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.word.length !== b.item.word.length) return a.item.word.length - b.item.word.length;
    return a.item.word.localeCompare(b.item.word);
  });

  return results.slice(0, limit).map(r => r.item);
}

/**
 * Map Free Dictionary API part of speech to the 13 supported types
 */
function normalizePartOfSpeech(pos, word = '') {
  if (!pos) return 'noun';
  const p = pos.toLowerCase().trim();

  // Check if multiple words (idiom / phrase / phrasal verb)
  if (word.includes(' ')) {
    if (p.includes('verb')) return 'phrasal verb';
    return 'phrase';
  }

  if (p === 'noun' || p.includes('noun')) return 'noun';
  if (p === 'verb' || p.includes('verb')) return 'verb';
  if (p === 'adjective' || p.includes('adj')) return 'adjective';
  if (p === 'adverb' || p.includes('adv')) return 'adverb';
  if (p === 'preposition' || p.includes('prep')) return 'preposition';
  if (p === 'pronoun' || p.includes('pron')) return 'pronoun';
  if (p === 'conjunction' || p.includes('conj')) return 'conjunction';
  if (p === 'interjection' || p.includes('int')) return 'interjection';
  if (p === 'determiner' || p.includes('det') || p.includes('article')) return 'determiner';
  if (p.includes('modal')) return 'modal verb';

  return 'noun';
}

/**
 * Look up word details from the Free Dictionary API with timeout
 * @param {string} rawWord
 * @returns {Promise<Object|null>}
 */
export async function lookupOnlineWord(rawWord) {
  const word = (rawWord || '').trim();
  if (!word) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    const actualWord = entry.word || word;

    // Extract phonetic
    let phonetic = entry.phonetic || '';
    if (!phonetic && Array.isArray(entry.phonetics)) {
      const pWithText = entry.phonetics.find(p => p.text);
      if (pWithText) phonetic = pWithText.text;
    }

    // Extract first meaning
    let bestMeaning = '';
    let wordType = 'noun';
    let example = '';

    if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
      const m = entry.meanings[0];
      wordType = normalizePartOfSpeech(m.partOfSpeech, actualWord);

      if (Array.isArray(m.definitions) && m.definitions.length > 0) {
        const def = m.definitions[0];
        bestMeaning = def.definition || '';
        example = def.example || '';

        // If first definition has no example, find one with example
        if (!example) {
          const defWithEx = m.definitions.find(d => d.example);
          if (defWithEx) example = defWithEx.example;
        }
      }
    }

    return {
      word: actualWord,
      meaning: bestMeaning || 'Định nghĩa: ' + actualWord,
      type: wordType,
      phonetic: phonetic || '',
      example: example || `This is a contextual sentence with "${actualWord}".`,
      exampleVi: '',
      isOnline: true
    };
  } catch (_err) {
    return null;
  }
}
