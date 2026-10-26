// Tuple order: word, Vietnamese meaning, IPA, example, translation, synonyms, antonyms, word type.
const travel = [
  ['journey', 'chuyến đi', '/ˈdʒɜːni/', 'The journey takes two hours by train.', 'Chuyến đi mất hai giờ bằng tàu hỏa.', ['trip'], [], 'Danh từ'],
  ['depart', 'khởi hành', '/dɪˈpɑːt/', 'Our train will depart at noon.', 'Tàu của chúng tôi sẽ khởi hành vào buổi trưa.', ['leave'], ['arrive'], 'Động từ'],
  ['arrive', 'đến nơi', '/əˈraɪv/', 'We will arrive before sunset.', 'Chúng tôi sẽ đến nơi trước khi mặt trời lặn.', ['reach a destination'], ['depart'], 'Động từ'],
  ['luggage', 'hành lý', '/ˈlʌɡɪdʒ/', 'Please keep your luggage with you.', 'Vui lòng giữ hành lý bên mình.', ['baggage'], [], 'Danh từ'],
  ['reserve', 'đặt trước', '/rɪˈzɜːv/', 'I would like to reserve a seat.', 'Tôi muốn đặt trước một chỗ ngồi.', ['book'], [], 'Động từ'],
  ['destination', 'điểm đến', '/ˌdestɪˈneɪʃən/', 'Our final destination is a small coastal town.', 'Điểm đến cuối cùng của chúng tôi là một thị trấn nhỏ ven biển.', ['endpoint'], ['starting point'], 'Danh từ'],
  ['delay', 'sự chậm trễ', '/dɪˈleɪ/', 'Heavy rain caused a delay of thirty minutes.', 'Mưa lớn đã gây ra sự chậm trễ ba mươi phút.', ['hold-up'], [], 'Danh từ'],
  ['route', 'tuyến đường', '/ruːt/', 'This route passes through the city centre.', 'Tuyến đường này đi qua trung tâm thành phố.', ['path', 'course'], [], 'Danh từ'],
  ['crowded', 'đông đúc', '/ˈkraʊdɪd/', 'The bus was crowded this morning.', 'Xe buýt rất đông đúc sáng nay.', ['packed'], ['uncrowded'], 'Tính từ'],
  ['nearby', 'ở gần', '/ˌnɪəˈbaɪ/', 'There is a nearby hotel with comfortable rooms.', 'Có một khách sạn ở gần với các phòng thoải mái.', ['close', 'local'], ['distant'], 'Tính từ'],
];

const studyWork = [
  ['assignment', 'bài tập được giao', '/əˈsaɪnmənt/', 'Please finish the assignment by Friday.', 'Vui lòng hoàn thành bài tập được giao trước hoặc vào thứ Sáu.', ['task'], [], 'Danh từ'],
  ['deadline', 'hạn chót', '/ˈdedlaɪn/', 'The deadline for this report is Monday.', 'Hạn chót cho báo cáo này là thứ Hai.', ['due date'], [], 'Danh từ'],
  ['research', 'nghiên cứu', '/rɪˈsɜːtʃ/', 'Her research focuses on language learning.', 'Nghiên cứu của cô ấy tập trung vào việc học ngôn ngữ.', ['investigation', 'study'], [], 'Danh từ'],
  ['collaborate', 'hợp tác', '/kəˈlæbəreɪt/', 'The two teams collaborate on a new project.', 'Hai nhóm hợp tác trong một dự án mới.', ['cooperate', 'work together'], ['work alone'], 'Động từ'],
  ['efficient', 'hiệu quả', '/ɪˈfɪʃənt/', 'This method is efficient and saves time.', 'Phương pháp này hiệu quả và tiết kiệm thời gian.', ['productive'], ['inefficient'], 'Tính từ'],
  ['accurate', 'chính xác', '/ˈækjərət/', 'Make sure the information is accurate.', 'Hãy đảm bảo thông tin chính xác.', ['correct', 'precise'], ['inaccurate', 'incorrect'], 'Tính từ'],
  ['revise', 'ôn tập', '/rɪˈvaɪz/', 'I revise my notes before each exam.', 'Tôi ôn tập các ghi chú trước mỗi kỳ thi.', ['review'], [], 'Động từ'],
  ['submit', 'nộp', '/səbˈmɪt/', 'You can submit your application online.', 'Bạn có thể nộp đơn trực tuyến.', ['hand in', 'turn in'], [], 'Động từ'],
  ['feedback', 'ý kiến phản hồi', '/ˈfiːdbæk/', 'The teacher gave useful feedback on my essay.', 'Giáo viên đã đưa ra những ý kiến phản hồi hữu ích về bài luận của tôi.', ['comments', 'response'], [], 'Danh từ'],
  ['qualify', 'đủ điều kiện', '/ˈkwɒlɪfaɪ/', 'This certificate will help you qualify for the position.', 'Chứng chỉ này sẽ giúp bạn đủ điều kiện cho vị trí đó.', ['meet the requirements'], [], 'Động từ'],
];

function makeCards(entries, setId, firstId) {
  return entries.map(([front, back, phonetic, example, exampleVi, synonyms, antonyms, wordType], index) => ({
    id: String(firstId + index),
    setId,
    front,
    back,
    phonetic,
    example,
    audioUrl: null,
    meaning: back,
    exampleVi,
    synonyms,
    antonyms,
    wordType,
  }));
}

export const additionalCards = [
  ...makeCards(travel, '2', 11),
  ...makeCards(studyWork, '3', 21),
];
