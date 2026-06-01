export interface Product {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  stock: number;
  embedding?: number[];
}

export const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Books', 'Sports'];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299, basePrice: 299,
    rating: 4.8, stock: 12,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    category: 'Electronics',
    description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
  },
  {
    id: '2',
    name: 'Minimalist Watch',
    price: 149, basePrice: 149,
    rating: 4.6, stock: 8,
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop',
    category: 'Fashion',
    description: 'Elegant minimalist timepiece with sapphire crystal and leather strap.',
  },
  {
    id: '3',
    name: 'Smart Home Speaker',
    price: 179, basePrice: 179,
    rating: 4.7, stock: 20,
    image: 'https://images.unsplash.com/photo-1589003077984-894e133da26d?w=500&h=500&fit=crop',
    category: 'Electronics',
    description: 'Voice-controlled smart speaker with premium sound quality.',
  },
  {
    id: '4',
    name: 'Vintage Sunglasses',
    price: 189, basePrice: 189,
    rating: 4.5, stock: 5,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    category: 'Fashion',
    description: 'UV-protected vintage-style sunglasses with polarized lenses.',
  },
  {
    id: '5',
    name: 'Designer Backpack',
    price: 259, basePrice: 259,
    rating: 4.9, stock: 3,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    category: 'Fashion',
    description: 'Durable and stylish backpack with weather-resistant material.',
  },
  {
    id: '6',
    name: 'Ceramic Vase Set',
    price: 89, basePrice: 89,
    rating: 4.4, stock: 15,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop',
    category: 'Home',
    description: 'Modern ceramic vases perfect for any room décor.',
  },
  {
    id: '7',
    name: 'Bestselling Novel',
    price: 24, basePrice: 24,
    rating: 4.8, stock: 50,
    image: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop',
    category: 'Books',
    description: 'Award-winning contemporary fiction novel.',
  },
  {
    id: '8',
    name: 'Yoga Mat Premium',
    price: 79, basePrice: 79,
    rating: 4.6, stock: 18,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop',
    category: 'Sports',
    description: 'Non-slip eco-friendly yoga mat for comfort and stability.',
  },
];
