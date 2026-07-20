CREATE TABLE `message_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text DEFAULT 'Genel' NOT NULL,
	`label` text NOT NULL,
	`body` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `message_templates_group_idx` ON `message_templates` (`category`,`sort_order`);
--> statement-breakpoint
INSERT INTO `message_templates` (`category`, `label`, `body`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
('Takip', 'Haftalık hatırlatma', 'Merhaba {ad}! Bu haftanın programını ve soru takibini uygulamaya işlemeyi unutma, birlikte takip edelim 💪', 0, 1, unixepoch(), unixepoch()),
('Takip', 'Deneme duyurusu', 'Merhaba {ad}! Bu hafta sonu deneme var — hazırlıklı olalım, eksik konularını birlikte kapatalım 📊', 1, 1, unixepoch(), unixepoch()),
('Takip', 'Motivasyon', 'Merhaba {ad} 👋 Bu hafta güzel gidiyorsun, tempoyu koruyalım — hedefe emin adımlarla 🎯', 2, 1, unixepoch(), unixepoch()),
('Takip', 'Görüşme hatırlatma', 'Merhaba {ad}, yaklaşan koçluk görüşmemiz öncesi programını ve sorularını doldurmayı unutma 🙌', 3, 1, unixepoch(), unixepoch()),
('Ödeme', 'Vade yaklaşıyor', 'Merhaba {ad} 👋 Bu dönem ödemenin vadesi yaklaşıyor. Uygun olduğunda halledebilirsek çok makbule geçer — takıldığın bir şey olursa buradan yazabilirsin 🙏', 0, 1, unixepoch(), unixepoch()),
('Ödeme', 'Vade geçti (nazik)', 'Merhaba {ad}, ödemenin vadesi geçmiş görünüyor. Bir aksilik olduysa haber ver, birlikte çözeriz — uygun olduğunda tamamlayabilir miyiz? 🙏', 1, 1, unixepoch(), unixepoch()),
('Ödeme', 'Ödeme teşekkür', 'Merhaba {ad}! Ödemen elimize ulaştı, çok teşekkür ederiz 🙏 Yolun açık olsun — her adımda yanındayız 💪', 2, 1, unixepoch(), unixepoch()),
('Ödeme', 'Yeni dönem ödemesi', 'Merhaba {ad} 👋 Yeni dönem başlıyor — kaydının kesintisiz sürmesi için ödeme detaylarını iletiyorum. Bir sorun olursa buradan ulaşabilirsin 🙌', 3, 1, unixepoch(), unixepoch()),
('Yeni öğrenci', 'Hoş geldin', 'Merhaba {ad} 👋 Derecenin Ruhu ailesine hoş geldin! 🎉 Bu yolculukta yanındayız — ilk adım olarak uygulamaya giriş yapıp seni tanıyalım 💪', 0, 1, unixepoch(), unixepoch()),
('Yeni öğrenci', 'Kurulum / davet', 'Merhaba {ad}! Takip sistemimize davetlisin — telefonun ve belirleyeceğin PIN ile dereceninruhu.com/katil adresinden giriş yapıp başlayabilirsin 👇', 1, 1, unixepoch(), unixepoch()),
('Yeni öğrenci', 'İlk görüşme', 'Merhaba {ad} 👋 Tanışma görüşmemizi planlayalım — hedeflerini konuşup sana özel bir yol haritası çıkaralım. Bu hafta hangi gün/saat uygun olur? 😊', 2, 1, unixepoch(), unixepoch()),
('Yeni öğrenci', 'Başlangıç rehberi', 'Merhaba {ad}! İlk hafta için önerim: her gün çözdüğün soruları uygulamaya işle, bir deneme çöz ve eksik konularını not al. Gerisini birlikte hallederiz 🎯', 3, 1, unixepoch(), unixepoch()),
('Önemli', 'Program güncellemesi', 'Merhaba {ad} 👋 Bu haftanın programında bir güncelleme var — uygulamadan güncel haline göz atmayı unutma 🙌', 0, 1, unixepoch(), unixepoch()),
('Önemli', 'Dönem duyurusu', 'Merhaba {ad}! Yeni dönemle ilgili önemli bir duyurumuz var — detayları aşağıda paylaşıyorum. Sorularını buradan iletebilirsin 📣', 1, 1, unixepoch(), unixepoch()),
('Önemli', 'Tatil / ara', 'Merhaba {ad} 👋 Kısa bir ara dönemine giriyoruz. Tempoyu tümden bırakma; günde birkaç soruyla ısınmayı sürdür — döndüğümüzde kaldığımız yerden devam 💪', 2, 1, unixepoch(), unixepoch()),
('Önemli', 'Önemli / acil', 'Merhaba {ad}, seninle önemli bir konuyu konuşmam gerekiyor. Uygun olduğunda bana buradan dönebilir misin? 🙏', 3, 1, unixepoch(), unixepoch());