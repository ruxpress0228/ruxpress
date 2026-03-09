// Mock data for Ruxpress application
import type { 
  User, 
  PurchaseRequest, 
  Inquiry, 
  Notice, 
  ExchangeRate, 
  Admin
} from '../types';

export const currentUser: User = {
  id: 1,
  email: 'user@example.com',
  phone: '+821012345678',
  nickname: '김철수',
  profileImageUrl: undefined,
  status: 'ACTIVE',
  emailVerified: true,
  phoneVerified: true,
  signupType: 'EMAIL',
  timezone: 'Asia/Seoul',
  notificationSettings: {
    push: { inquiryReply: true, notice: true, promotion: true, purchaseStatus: true },
    sms: { inquiryReply: false, notice: false, promotion: false, purchaseStatus: true },
    email: { inquiryReply: true, notice: true, promotion: false, purchaseStatus: true }
  },
  lastLoginAt: '2026-03-07T10:30:00Z',
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-03-07T10:30:00Z'
};

export const currentAdmin: Admin = {
  id: 1,
  email: 'admin@ruxpress.com',
  name: '관리자',
  phone: '+821098765432',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  lastLoginAt: '2026-03-07T09:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-03-07T09:00:00Z'
};

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 1,
    userId: 1,
    requestNumber: 'PUR-20260307-0001',
    productName: '쿠팡 겨울 코트',
    quantity: 1,
    urls: [{ url: 'https://www.coupang.com/vp/products/12345', shop: '쿠팡' }],
    options: [
      { name: '색상', value: 'Black' },
      { name: '사이즈', value: 'M' }
    ],
    priceRub: 5000,
    priceKrw: 75000,
    exchangeRateId: 1,
    feeAmount: 9000,
    totalAmountKrw: 84000,
    memo: '빠른 배송 부탁드립니다.',
    status: 'REVIEWING',
    createdAt: '2026-03-05T14:20:00Z',
    updatedAt: '2026-03-05T14:20:00Z'
  },
  {
    id: 2,
    userId: 1,
    requestNumber: 'PUR-20260306-0012',
    productName: 'Gmarket 스마트워치',
    quantity: 2,
    urls: [{ url: 'https://item.gmarket.co.kr/Item?goodscode=67890', shop: 'Gmarket' }],
    options: [{ name: '색상', value: 'Silver' }],
    priceRub: 3500,
    priceKrw: 52500,
    exchangeRateId: 1,
    feeAmount: 6300,
    totalAmountKrw: 58800,
    status: 'PURCHASING',
    assignedAdminId: 1,
    createdAt: '2026-03-06T09:15:00Z',
    updatedAt: '2026-03-06T16:30:00Z'
  },
  {
    id: 3,
    userId: 1,
    requestNumber: 'PUR-20260301-0003',
    productName: '올리브영 노트북 가방',
    quantity: 1,
    urls: [{ url: 'https://www.oliveyoung.co.kr/store/goods/11111', shop: '올리브영' }],
    priceRub: 2000,
    priceKrw: 30000,
    exchangeRateId: 1,
    feeAmount: 3600,
    totalAmountKrw: 33600,
    status: 'DELIVERED',
    assignedAdminId: 1,
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-04T15:00:00Z'
  }
];

export const mockInquiries: Inquiry[] = [
  {
    id: 1,
    userId: 1,
    category: 'SHIPPING',
    title: '배송 기간이 얼마나 걸리나요?',
    content: '한국에서 러시아까지 배송 기간이 궁금합니다. 보통 얼마나 걸리나요?',
    status: 'REPLIED',
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
    replies: [
      {
        id: 1,
        inquiryId: 1,
        adminId: 1,
        content: '안녕하세요. 통상적으로 7~14일 정도 소요됩니다. 통관 상황에 따라 지연될 수 있습니다.',
        isRead: true,
        createdAt: '2026-03-05T14:00:00Z',
        updatedAt: '2026-03-05T14:00:00Z'
      }
    ]
  },
  {
    id: 2,
    userId: 1,
    category: 'PAYMENT',
    title: '환율이 어떻게 적용되나요?',
    content: '구매 시점의 환율로 계산되는지, 결제 시점의 환율로 계산되는지 궁금합니다.',
    status: 'PENDING',
    createdAt: '2026-03-07T09:30:00Z',
    updatedAt: '2026-03-07T09:30:00Z'
  },
  {
    id: 3,
    userId: 1,
    category: 'ORDER',
    title: '옵션 변경이 가능한가요?',
    content: '이미 제출한 구매 요청의 색상 옵션을 변경하고 싶습니다.',
    status: 'REPLIED',
    createdAt: '2026-03-04T16:20:00Z',
    updatedAt: '2026-03-04T18:00:00Z',
    replies: [
      {
        id: 2,
        inquiryId: 3,
        adminId: 1,
        content: '구매 진행 전이라면 변경 가능합니다. 요청 번호를 알려주시면 확인해드리겠습니다.',
        isRead: true,
        createdAt: '2026-03-04T18:00:00Z',
        updatedAt: '2026-03-04T18:00:00Z'
      }
    ]
  }
];

export const mockNotices: Notice[] = [
  {
    id: 1,
    adminId: 1,
    title: '[중요] 3월 환율 변동 안내',
    content: '<p>최근 루블 환율 변동으로 인해 3월 7일부터 적용 환율이 변경됩니다.</p><p>현재 환율: 1 RUB = 15.00 KRW</p>',
    isPinned: true,
    viewCount: 245,
    status: 'PUBLISHED',
    publishedAt: '2026-03-06T09:00:00Z',
    createdAt: '2026-03-05T15:00:00Z',
    updatedAt: '2026-03-05T15:00:00Z'
  },
  {
    id: 2,
    adminId: 1,
    title: '설 연휴 배송 지연 안내',
    content: '<p>설 연휴 기간(2월 9일~12일) 동안 배송이 지연될 수 있습니다.</p><p>양해 부탁드립니다.</p>',
    isPinned: false,
    viewCount: 156,
    status: 'PUBLISHED',
    publishedAt: '2026-02-05T10:00:00Z',
    createdAt: '2026-02-04T14:00:00Z',
    updatedAt: '2026-02-04T14:00:00Z'
  },
  {
    id: 3,
    adminId: 1,
    title: '신규 제휴 쇼핑몰 추가',
    content: '<p>한국 쇼핑몰 제휴 확대로 더 다양한 한국 상품을 구매하실 수 있게 되었습니다.</p>',
    isPinned: false,
    viewCount: 89,
    status: 'PUBLISHED',
    publishedAt: '2026-03-01T00:00:00Z',
    createdAt: '2026-02-28T16:30:00Z',
    updatedAt: '2026-02-28T16:30:00Z'
  }
];

export const currentExchangeRate: ExchangeRate = {
  id: 1,
  baseCurrency: 'RUB',
  targetCurrency: 'KRW',
  rate: 15.0,
  source: 'API',
  isCurrent: true,
  fetchedAt: '2026-03-07T00:00:00Z',
  createdAt: '2026-03-07T00:00:00Z'
};

export const mockExchangeRates: ExchangeRate[] = [
  currentExchangeRate,
  {
    id: 2,
    baseCurrency: 'RUB',
    targetCurrency: 'KRW',
    rate: 14.8,
    source: 'API',
    isCurrent: false,
    fetchedAt: '2026-03-06T00:00:00Z',
    createdAt: '2026-03-06T00:00:00Z'
  },
  {
    id: 3,
    baseCurrency: 'RUB',
    targetCurrency: 'KRW',
    rate: 15.2,
    source: 'MANUAL',
    adminId: 1,
    isCurrent: false,
    fetchedAt: '2026-03-05T00:00:00Z',
    createdAt: '2026-03-05T00:00:00Z'
  }
];

export const mockUsers: User[] = [
  currentUser,
  {
    id: 2,
    email: 'user2@example.com',
    phone: '+821087654321',
    nickname: '이영희',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
    signupType: 'GOOGLE',
    timezone: 'Asia/Seoul',
    lastLoginAt: '2026-03-06T15:00:00Z',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-06T15:00:00Z'
  },
  {
    id: 3,
    email: 'user3@example.com',
    phone: '+821055556666',
    nickname: '박민수',
    status: 'ACTIVE',
    emailVerified: true,
    phoneVerified: false,
    signupType: 'EMAIL',
    timezone: 'Asia/Seoul',
    lastLoginAt: '2026-03-05T08:30:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-05T08:30:00Z'
  }
];
