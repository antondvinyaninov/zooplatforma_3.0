'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { InlineEdit } from '@/components/ui/InlineEdit';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { EnvelopeIcon, LockClosedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const DUMMY_OPTIONS = [
  { id: 1, name: 'Собака' },
  { id: 2, name: 'Кошка' },
  { id: 3, name: 'Птица' },
  { id: 4, name: 'Другое' },
];

export default function UIKitPage() {
  const [checkbox1, setCheckbox1] = useState(false);
  const [switch1, setSwitch1] = useState(false);
  const [select1, setSelect1] = useState(String(DUMMY_OPTIONS[0].id));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inlineValue, setInlineValue] = useState('Текст, который можно изменять');

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Обширная UI Библиотека</h1>
        <p className="text-gray-500">Premium Mobile-First Components (React + Tailwind + Headless UI)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* LEFT COLUMN: FORMS & INTERACTIVE */}
        <div className="space-y-12">
          
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Базовые элементы (Input, Button)</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Поля Ввода (Input)</Label>
                <div className="space-y-3">
                  <Input placeholder="Обычный ввод..." />
                  <Input placeholder="С иконкой..." icon={<MagnifyingGlassIcon className="w-5 h-5" />} />
                  <Input type="password" placeholder="Пароль..." icon={<LockClosedIcon className="w-5 h-5" />} />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Многострочный текст (Textarea)</Label>
                <Textarea placeholder="Ваш комментарий..." />
              </div>

              <div>
                <Label className="mb-2 block">Кнопки (Button)</Label>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large Element</Button>
                  <Button size="icon" variant="outline">
                    <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </div>
          </section>
          
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Формы (Новые)</h2>
            <div className="space-y-6">
              
              <div className="flex items-center gap-3">
                <Checkbox checked={checkbox1} onChange={setCheckbox1} />
                <Label className="cursor-pointer" onClick={() => setCheckbox1(!checkbox1)}>Согласен с правилами</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={switch1} onCheckedChange={setSwitch1} />
                <Label className="cursor-pointer" onClick={() => setSwitch1(!switch1)}>Включить уведомления (Switch)</Label>
              </div>

              <div>
                <Label className="mb-2 block">Выпадающий список (Headless Select)</Label>
                <Select value={select1} onValueChange={(v) => setSelect1(v || '')}>
                  <SelectTrigger className="w-full h-10 border border-gray-200">
                    <SelectValue placeholder="Выберите..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DUMMY_OPTIONS.map(opt => (
                      <SelectItem key={opt.id} value={String(opt.id)}>{opt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Редактирование на месте (Inline Edit)</Label>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <div className="mb-1 text-xs text-gray-500 uppercase tracking-wider font-semibold">Название проекта:</div>
                  <InlineEdit 
                    value={inlineValue} 
                    onSave={(val) => setInlineValue(val)} 
                    className="text-lg font-medium max-w-sm"
                  />
                  <p className="mt-2 text-xs text-gray-400">Нажми на текст сверху, чтобы изменить его.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Модальное окно (Dialog)</h2>
            <div>
              <Button onClick={() => setIsDialogOpen(true)}>Открыть Dialog</Button>
              <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle onClose={() => setIsDialogOpen(false)}>Удаление питомца</DialogTitle>
                <p className="text-sm text-gray-500">Вы уверены, что хотите удалить эту запись? Это действие нельзя отменить.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                  <Button variant="danger" onClick={() => setIsDialogOpen(false)}>Удалить навсегда</Button>
                </DialogFooter>
              </Dialog>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Вкладки (Tabs)</h2>
            <Tabs 
              categories={[
                { name: 'Посты', content: <p className="text-sm text-gray-600">Здесь будут все ваши последние посты.</p> },
                { name: 'Галерея', content: <p className="text-sm text-gray-600">Ваша фото-галерея питомцев.</p> },
                { name: 'Настройки', content: <p className="text-sm text-gray-600">Окно с параметрами и уведомлениями.</p> },
              ]} 
            />
          </section>

        </div>

        {/* RIGHT COLUMN: DISPLAY COMPONENTS */}
        <div className="space-y-12">
          
          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Отображение данных (Display)</h2>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 block">Badges (Плашки статуса)</h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Ищет дом</Badge>
                <Badge variant="secondary">Архив</Badge>
                <Badge variant="success">Пристроен</Badge>
                <Badge variant="warning">На лечении</Badge>
                <Badge variant="destructive">Удален</Badge>
                <Badge variant="outline">Черновик</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 block">Avatars</h3>
              <div className="flex gap-4 items-end">
                <Avatar size="sm" fallback="SM" />
                <Avatar size="md" fallback="MD" />
                <Avatar size="lg" fallback="LG" />
                <Avatar size="xl" src="https://i.pravatar.cc/150" fallback="XL" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 block">Skeleton Loader (Заглушки загрузки)</h3>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
            
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2">Карточки (Card)</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar fallback="ЗП" />
                  <div>
                    <CardTitle>Питомец "Барсик"</CardTitle>
                    <CardDescription>Кот, метис, 2 года</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Барсик — это очень ласковый и игривый кот, который ищет заботливую семью. Приучен к лотку, обработан от паразитов.</p>
              </CardContent>
              <CardFooter className="justify-end gap-3">
                <Button variant="outline" size="sm">Поделиться</Button>
                <Button variant="primary" size="sm">Забрать домой</Button>
              </CardFooter>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
}
