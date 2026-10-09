import { Award, Flower2, GraduationCap, Heart, MapPin, PartyPopper, type LucideIcon } from 'lucide-react';

/** Quick occasion chips: a tap fills the prompt with a natural sentence. */
export const OCCASION_CHIPS: Array<{ label: string; icon: LucideIcon; prompt: string }> = [
  { label: 'Kỷ yếu', icon: GraduationCap, prompt: 'Chụp kỷ yếu cùng lớp, muốn trẻ trung, hiện đại nhưng không mất chất' },
  { label: 'Tốt nghiệp', icon: Award, prompt: 'Lễ tốt nghiệp, thanh lịch, tối giản, tông xanh' },
  { label: 'Tết', icon: Flower2, prompt: 'Du xuân ngày Tết, đi chùa với gia đình, màu đỏ may mắn' },
  { label: 'Lễ hội', icon: PartyPopper, prompt: 'Đi lễ hội làng, mộc mạc dân gian, dễ di chuyển' },
  { label: 'Đám cưới', icon: Heart, prompt: 'Đi đám cưới người thân, sang trọng nhưng không lấn át cô dâu' },
  { label: 'Du lịch', icon: MapPin, prompt: 'Dạo phố cổ Hội An, trời nắng, năng động, lên ảnh đẹp' },
];
