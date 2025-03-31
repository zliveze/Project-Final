import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

@Schema({ timestamps: true })
export class Address {
  @Prop()
  addressId: string;

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  postalCode: string;

  @Prop({ default: false })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone: string;

  @Prop()
  password: string;

  @Prop()
  googleId: string;

  @Prop()
  avatar: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  @Prop({ enum: ['user', 'admin', 'superadmin'], default: 'user' })
  role: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: [String], default: [] })
  wishlist: string[];

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;

  @Prop()
  verificationToken: string;

  @Prop()
  verificationExpires: Date;

  @Prop()
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Thêm các index để tối ưu truy vấn với lượng dữ liệu lớn
UserSchema.index({ email: 1 }, { unique: true });  // Index cho email (unique)
UserSchema.index({ name: 'text', email: 'text', phone: 'text' });  // Text index cho tìm kiếm
UserSchema.index({ isDeleted: 1 });  // Index cho trường isDeleted vì nó được dùng trong hầu hết các truy vấn
UserSchema.index({ role: 1 });  // Index cho trường role
UserSchema.index({ isActive: 1 });  // Index cho trường isActive
UserSchema.index({ isBanned: 1 });  // Index cho trường isBanned
UserSchema.index({ createdAt: -1 });  // Index cho trường createdAt (sắp xếp giảm dần)
UserSchema.index({ isActive: 1, isBanned: 1, isDeleted: 1 });  // Compound index cho các trường lọc phổ biến
UserSchema.index({ role: 1, isActive: 1, isBanned: 1 });  // Compound index cho các trường lọc phổ biến khác

// Middleware trước khi lưu để hash mật khẩu
UserSchema.pre('save', async function (next) {
  try {
    const user = this as UserDocument;
    
    // Bỏ qua nếu password không tồn tại (đăng nhập bằng Google)
    if (!user.password) {
      return next();
    }
    
    // Chỉ hash password khi nó bị thay đổi hoặc là người dùng mới
    if (!user.isModified('password')) {
      return next();
    }

    // Hash mật khẩu với salt factor là 10
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức để so sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    const user = this as UserDocument;
    
    // Trả về false nếu tài khoản không có mật khẩu (đăng nhập bằng Google)
    if (!user.password) {
      return false;
    }
    
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    throw error;
  }
}; 