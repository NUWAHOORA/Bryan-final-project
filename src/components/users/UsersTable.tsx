import { MoreHorizontal, Shield, GraduationCap, Briefcase, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { UserWithRole, useApproveUser, useUpdateUserRole } from '@/hooks/useUsers';

const roleIcons = {
  admin: Shield,
  organizer: Briefcase,
  student: GraduationCap,
};

const roleColors = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  organizer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  student: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

interface UsersTableProps {
  users: UserWithRole[];
  currentUserId?: string;
  isAdmin: boolean;
  onDeleteUser: (user: UserWithRole) => void;
}

export function UsersTable({ users, currentUserId, isAdmin, onDeleteUser }: UsersTableProps) {
  const { mutate: approveUser, isPending: isApproving } = useApproveUser();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();

  const handleRoleChange = (user: UserWithRole, newRole: 'admin' | 'organizer' | 'student') => {
    updateRole({ 
      userId: user.user_id, 
      email: user.email, 
      name: user.name, 
      role: newRole 
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden md:table-cell">Department</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const RoleIcon = roleIcons[user.role];
              const isCurrentUser = user.user_id === currentUserId;
              
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {user.department || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {user.is_approved ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.is_approved && (
                            <DropdownMenuItem 
                              className="text-green-600 focus:text-green-600"
                              onClick={() => approveUser(user)}
                              disabled={isApproving}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user, 'admin')}
                                  disabled={user.role === 'admin' || isUpdatingRole}
                                >
                                  Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user, 'organizer')}
                                  disabled={user.role === 'organizer' || isUpdatingRole}
                                >
                                  Organizer
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(user, 'student')}
                                  disabled={user.role === 'student' || isUpdatingRole}
                                >
                                  Student
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
