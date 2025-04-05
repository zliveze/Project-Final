// import React, { useState, useEffect } from 'react';
// import { useAdminUser } from '@/contexts/AdminUserContext';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../ui/table";
// import { Button } from "../ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";
// import { Badge } from "../ui/badge";
// import { MoreHorizontal, CheckCircle, XCircle, Info, Trash2, AlertTriangle } from 'lucide-react';
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogHeader, 
//   DialogTitle,
//   DialogFooter,
//   DialogDescription
// } from "../ui/dialog";
// import { toast } from 'react-hot-toast';

// export const UsersTable: React.FC = () => {
//   const { 
//     users, 
//     updateUserStatus, 
//     updateUserRole,
//     deleteUser,
//     fetchUsers, 
//     loading
//   } = useAdminUser();
  
//   const [selectedUser, setSelectedUser] = useState<any>(null);
//   const [showStatusDialog, setShowStatusDialog] = useState(false);
//   const [showRoleDialog, setShowRoleDialog] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [newStatus, setNewStatus] = useState("");
//   const [newRole, setNewRole] = useState("");
//   const [processing, setProcessing] = useState(false);

//   // Khởi tạo lần đầu
//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         // Fetch với tham số mặc định
//         await fetchUsers();
//       } catch (error) {
//         console.error('Lỗi khi tải dữ liệu:', error);
//       }
//     };
    
//     loadData();
//   }, [fetchUsers]);

//   // Hàm làm mới dữ liệu
//   const refreshData = async () => {
//     try {
//       // Gọi fetchUsers với force = true để buộc load mới từ server
//       await fetchUsers(undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
//     } catch (error) {
//       console.error('Lỗi khi làm mới dữ liệu:', error);
//     }
//   };

//   const handleUpdateStatus = async () => {
//     if (!selectedUser || !newStatus) return;

//     setProcessing(true);
//     try {
//       const success = await updateUserStatus(selectedUser.id, newStatus);
//       if (success) {
//         toast.success(`Trạng thái người dùng đã được cập nhật thành ${newStatus}`);
//         setShowStatusDialog(false);
        
//         // Làm mới dữ liệu
//         await refreshData();
//       } else {
//         toast.error('Không thể cập nhật trạng thái người dùng');
//       }
//     } catch (error) {
//       console.error('Lỗi cập nhật trạng thái:', error);
//       toast.error('Đã xảy ra lỗi');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleUpdateRole = async () => {
//     if (!selectedUser || !newRole) return;

//     setProcessing(true);
//     try {
//       const success = await updateUserRole(selectedUser.id, newRole);
//       if (success) {
//         toast.success(`Vai trò người dùng đã được cập nhật thành ${newRole}`);
//         setShowRoleDialog(false);
        
//         // Làm mới dữ liệu
//         await refreshData();
//       } else {
//         toast.error('Không thể cập nhật vai trò người dùng');
//       }
//     } catch (error) {
//       console.error('Lỗi cập nhật vai trò:', error);
//       toast.error('Đã xảy ra lỗi');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleDeleteUser = async () => {
//     if (!selectedUser) return;

//     setProcessing(true);
//     try {
//       const success = await deleteUser(selectedUser.id);
//       if (success) {
//         toast.success(`Người dùng ${selectedUser.name} đã được xóa thành công`);
//         setShowDeleteDialog(false);
        
//         // Làm mới dữ liệu
//         await refreshData();
//       } else {
//         toast.error('Không thể xóa người dùng');
//       }
//     } catch (error) {
//       console.error('Lỗi khi xóa người dùng:', error);
//       toast.error('Đã xảy ra lỗi khi xóa người dùng');
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const openStatusDialog = (user: any) => {
//     setSelectedUser(user);
//     setNewStatus(user.status);
//     setShowStatusDialog(true);
//   };

//   const openRoleDialog = (user: any) => {
//     setSelectedUser(user);
//     setNewRole(user.role);
//     setShowRoleDialog(true);
//   };

//   const openDeleteDialog = (user: any) => {
//     setSelectedUser(user);
//     setShowDeleteDialog(true);
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'active':
//         return <Badge className="bg-green-500">Đang hoạt động</Badge>;
//       case 'inactive':
//         return <Badge className="bg-yellow-500">Không hoạt động</Badge>;
//       case 'blocked':
//         return <Badge className="bg-red-500">Đã khóa</Badge>;
//       default:
//         return <Badge className="bg-gray-500">{status}</Badge>;
//     }
//   };

//   const getRoleBadge = (role: string) => {
//     switch (role) {
//       case 'admin':
//         return <Badge className="bg-purple-500">Quản trị viên</Badge>;
//       case 'user':
//         return <Badge className="bg-blue-500">Người dùng</Badge>;
//       default:
//         return <Badge className="bg-gray-500">{role}</Badge>;
//     }
//   };

//   return (
//     <>
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>ID</TableHead>
//             <TableHead>Tên</TableHead>
//             <TableHead>Email</TableHead>
//             <TableHead>Vai trò</TableHead>
//             <TableHead>Trạng thái</TableHead>
//             <TableHead>Thao tác</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {users.map((user) => (
//             <TableRow key={user.id}>
//               <TableCell className="font-medium">{user.id.substring(0, 8)}...</TableCell>
//               <TableCell>{user.name}</TableCell>
//               <TableCell>{user.email}</TableCell>
//               <TableCell>{getRoleBadge(user.role)}</TableCell>
//               <TableCell>{getStatusBadge(user.status)}</TableCell>
//               <TableCell>
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="ghost" className="h-8 w-8 p-0">
//                       <span className="sr-only">Mở menu</span>
//                       <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem onClick={() => openStatusDialog(user)}>
//                       Thay đổi trạng thái
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => openRoleDialog(user)}>
//                       Thay đổi vai trò
//                     </DropdownMenuItem>
//                     <DropdownMenuItem 
//                       onClick={() => openDeleteDialog(user)}
//                       className="text-red-500 focus:text-red-500 focus:bg-red-50"
//                     >
//                       Xóa người dùng
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>

//       {/* Dialog cập nhật trạng thái */}
//       <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Cập nhật trạng thái người dùng</DialogTitle>
//             <DialogDescription>
//               Thay đổi trạng thái cho người dùng {selectedUser?.name}
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="grid gap-4 py-4">
//             <div className="flex flex-col space-y-3">
//               <label>Chọn trạng thái:</label>
//               <div className="flex flex-col space-y-2">
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="active"
//                     name="status"
//                     value="active"
//                     checked={newStatus === "active"}
//                     onChange={() => setNewStatus("active")}
//                   />
//                   <label htmlFor="active" className="flex items-center">
//                     <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
//                     Đang hoạt động
//                   </label>
//                 </div>
                
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="inactive"
//                     name="status"
//                     value="inactive"
//                     checked={newStatus === "inactive"}
//                     onChange={() => setNewStatus("inactive")}
//                   />
//                   <label htmlFor="inactive" className="flex items-center">
//                     <Info className="h-4 w-4 text-yellow-500 mr-1" />
//                     Không hoạt động
//                   </label>
//                 </div>
                
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="blocked"
//                     name="status"
//                     value="blocked"
//                     checked={newStatus === "blocked"}
//                     onChange={() => setNewStatus("blocked")}
//                   />
//                   <label htmlFor="blocked" className="flex items-center">
//                     <XCircle className="h-4 w-4 text-red-500 mr-1" />
//                     Đã khóa
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button 
//               variant="outline" 
//               onClick={() => setShowStatusDialog(false)}
//               disabled={processing}
//             >
//               Hủy
//             </Button>
//             <Button 
//               onClick={handleUpdateStatus}
//               disabled={processing}
//             >
//               {processing ? "Đang xử lý..." : "Lưu thay đổi"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog cập nhật vai trò */}
//       <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Cập nhật vai trò người dùng</DialogTitle>
//             <DialogDescription>
//               Thay đổi vai trò cho người dùng {selectedUser?.name}
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="grid gap-4 py-4">
//             <div className="flex flex-col space-y-3">
//               <label>Chọn vai trò:</label>
//               <div className="flex flex-col space-y-2">
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="admin"
//                     name="role"
//                     value="admin"
//                     checked={newRole === "admin"}
//                     onChange={() => setNewRole("admin")}
//                   />
//                   <label htmlFor="admin">
//                     Quản trị viên
//                   </label>
//                 </div>
                
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="radio"
//                     id="user"
//                     name="role"
//                     value="user"
//                     checked={newRole === "user"}
//                     onChange={() => setNewRole("user")}
//                   />
//                   <label htmlFor="user">
//                     Người dùng
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button 
//               variant="outline" 
//               onClick={() => setShowRoleDialog(false)}
//               disabled={processing}
//             >
//               Hủy
//             </Button>
//             <Button 
//               onClick={handleUpdateRole}
//               disabled={processing}
//             >
//               {processing ? "Đang xử lý..." : "Lưu thay đổi"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Dialog xác nhận xóa người dùng */}
//       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle className="text-red-600 flex items-center gap-2">
//               <AlertTriangle className="h-5 w-5" /> Xác nhận xóa người dùng
//             </DialogTitle>
//             <DialogDescription>
//               Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{selectedUser?.name}</span> không? 
//               Hành động này không thể hoàn tác.
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="py-4">
//             <div className="p-4 bg-red-50 border border-red-200 rounded-md">
//               <div className="flex items-center gap-2 text-red-600 font-medium">
//                 <AlertTriangle className="h-5 w-5" />
//                 <span>Lưu ý quan trọng:</span>
//               </div>
//               <ul className="mt-2 text-sm text-red-700 space-y-1 list-disc pl-5">
//                 <li>Người dùng sẽ bị xóa vĩnh viễn khỏi hệ thống</li>
//                 <li>Tất cả dữ liệu liên quan đến người dùng này cũng sẽ bị xóa</li>
//                 <li>Hành động này không thể hoàn tác</li>
//               </ul>
//             </div>
            
//             {selectedUser && (
//               <div className="mt-4 p-3 border border-gray-200 rounded-md">
//                 <div className="text-sm"><strong>ID:</strong> {selectedUser.id}</div>
//                 <div className="text-sm"><strong>Email:</strong> {selectedUser.email}</div>
//                 <div className="text-sm"><strong>Vai trò:</strong> {selectedUser.role}</div>
//               </div>
//             )}
//           </div>
          
//           <DialogFooter>
//             <Button 
//               variant="outline" 
//               onClick={() => setShowDeleteDialog(false)}
//               disabled={processing}
//             >
//               Hủy
//             </Button>
//             <Button 
//               variant="destructive"
//               onClick={handleDeleteUser}
//               disabled={processing}
//               className="gap-2"
//             >
//               <Trash2 className="h-4 w-4" />
//               {processing ? "Đang xử lý..." : "Xóa người dùng"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }; 