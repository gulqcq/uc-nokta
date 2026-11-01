Use /vercel-web-deployment.

Bu proje için duyarlı (her cihazın ekran boyutuna uyum sağlayan) bir web sitesi oluştur.


1. Amaç 
"Üç Nokta", tamamen kurgusal dizi, film ve kitaplardan oluşan bir sitedir. Kullanıcı izlemek ya da okumak istediği kaydı arar, ayrıntısına bakar, izleme ya da okuma ekranını açar veya daha sonrası için kaydeder.


2. Hedef kullanıcı
"Ne izlesem, ne okusam?" diye bakınan, her yaştan ve her türlü cihazdan gelen kullanıcılardır.


3. Ana eylem (CTA)
Ana sayfada üç kategori (Dizi, Film, Kitap) bulunur. Ziyaretçi bu kategorilerden birine tıklayıp Keşfet sayfasına geçer ve izlemek ya da okumak için kayıtlardan birini seçer.


4. Veri
Bütün veriler veri.json dosyasının içerisindedir. Dosyadaki konu etiketleri (tags) şimdilik hiçbir yerde kullanılmasın; sonraki bir adımda eklenecek. Dosyada üç liste var: diziler, filmler ve kitaplar.

Dosyadaki bilgilerin adları İngilizcedir, hangisinin ne olduğunu dosyaya bakarak bulunsun.
Filtrelerdeki türler, diller ve ülkeler de bu dosyadan alınsın.

Her kaydın benzersiz bir kodu vardır (örneğin "yildiz-siniri"). Adreslerde bu kod kullanılsın.

Diziler için: ad, yayın yılı, bitiş yılı (dizi devam ediyorsa bitiş yılı yoktur), durum (Tamamlandı, Devam ediyor ya da İptal edildi), sezon sayısı, toplam bölüm sayısı, yönetmen, oyuncular, yapım şirketi, türler, ülke, orijinal dil ve 3–5 cümlelik konu özeti.

Filmler için: ad, yayın yılı, süre (dakika), yönetmen, oyuncular, türler, ülke, orijinal dil ve 3–5 cümlelik konu özeti.

Kitaplar için: ad, yayın yılı, yazar, çevirmen, aslının Türkçe olup olmadığı, sayfa sayısı, yayınevi, türler, orijinal dil ve 3–5 cümlelik konu özeti. Kitaplarda ülke bilgisi yoktur.

Bazı film ve kitaplar seri hâlindedir (26 film ve 33 kitap). Bu kayıtlarda serinin adı, serinin kaç parçadan oluştuğu ve kaydın serinin kaçıncı parçası olduğu yazar. Dizilerde ve seri olmayan film ve kitaplarda bu bilgi yoktur.

Bazı bilgiler dosyada ham hâldedir. Sitede şöyle gösterilsin:
- Dizilerde yıl: Tamamlandıysa "yayın yılı–bitiş yılı" (örneğin "2015–2019"), devam ediyorsa "yayın yılı–" (örneğin "2015–").
- Film süresi: Hem dakika hem saat ve dakika olarak, örneğin "102 dk (1 sa 42 dk)".
- Seri: "Seri adı (kaçıncı parça/toplam parça. film ya da kitap)". Örneğin film için "Atlı Yargıç Üçlemesi (2/3. film)", kitap için "Dedektif Harlow Serisi (3/3. kitap)".
- Çevirmen: Aslı Türkçe olan kitaplarda çevirmen yerine "Çeviri değil, aslı Türkçe" yazsın.


5. Sayfalar ve gezinme
Sitenin her ekranının kendi adresi olsun. Böylece tarayıcının geri ve ileri tuşları çalışsın ve bir kaydın bağlantısı başkasına gönderilebilsin. Her kaydın kendine özel bir adresi olsun. Adresler # işaretiyle başlasın (örneğin siteadi.com/#/kesfet); böylece sunucuda özel ayar gerekmez.

Ekranlar şunlar olsun:
- Ana sayfa: Kategorinin seçildiği, rastgele önerinin yapıldığı ve genel aramanın yapıldığı giriş sayfasıdır.
- Keşfet: Bir kategoriye ait ya da bütün kayıtların bulunduğu, filtrelerin kullanılabildiği, kayıtların kapak ve adlarıyla listelendiği ve kaydın seçildiği sayfadır.
- Kaydedilenler: Daha sonra izlemek ya da okumak için kaydedilenlerin bulunduğu sayfadır. Doluysa kayıtları kategoriye göre gösterir, boşsa "Henüz bir şey kaydetmedin" yazar.
- Ayrıntı penceresi: Bir kayda tıklanınca açılan pencere. Kaydın ayrıntıları, İzle/Oku ve Kaydet butonları burada bulunur.
- Dizi oynatıcısı: Dizide İzle butonuna basılınca açılan ekrandır. Bölümü izlemek için oynatıcı burada bulunur; sezon ve bölüm de buradan seçilir.
- Film oynatıcısı: Filmde İzle butonuna basılınca açılan ekrandır. Oynatıcının altında filmin konusu yer alır.
- Kitap okuyucusu: Kitapta Oku butonuna basılınca açılan, e-kitap okuma ekranına benzeyen ekrandır.

Gezinme kuralları:
- Site ilk açıldığında ana sayfa açılsın.
- Tarayıcının geri tuşu doğal çalışsın; kullanıcıyı her zaman bir önceki ekrana götürsün.
- Ayrıntı penceresi hangi sayfanın üstünde açıldıysa (Keşfet, Kaydedilenler ya da ana sayfa), kapatılınca o sayfaya dönülsün.
- Oynatıcıdan ya da okuyucudan geri dönünce ayrıntı penceresi yeniden açılsın ve kullanıcının bıraktığı kaydırma yerinde kalsın.
- Dizi oynatıcısında bölümden bölüme geçmek geri tuşunun sırasına eklenmesin. Kullanıcı birkaç bölüm gezse bile tek geri basışta ayrıntı penceresine dönsün.
- Menüdeki Keşfet butonuna basılınca Keşfet her zaman sıfırdan açılsın (aramasız, filtresiz).
- Esc tuşu açık olan oynatıcıyı, okuyucuyu ya da ayrıntı penceresini kapatsın.


6. Görsel yön
Sade ve temiz bir görünüm olsun. Dergi sayfasında olduğu gibi yazılar ve boşluklar öne çıksın, gereksiz süs olmasın.
- Sayfadaki öğeler birbirine sıkışmasın.
- Başlıklar büyük ve kalın olsun; harfler birbirine yakın dursun ama birbirine yapışmasın.
- Butonların köşeleri yuvarlak olsun.
- Gölge çok az kullanılsın.

Açık ve koyu iki tema olsun:
- Site ilk açıldığında cihazın tema ayarına uysun (cihaz koyu moddaysa koyu, açık moddaysa açık temada açılsın).
- Üst çubuktaki tema butonuyla tema değiştirilebilsin ve seçilen tema hatırlansın.

Logo yalnızca yan yana üç renkli noktadan oluşsun: mavi (#3a4dff), kırmızı (#d92d27), sarı (#f5b31b). Yanında yazı olmasın.


7. Renkler
Renkler kodun başında bir kez tanımlansın ve her yerde o tanım kullanılsın.

Kategori renkleri (her kategoriyi temsil eden buton, şerit ve panellerde kullanılsın):
- Dizi: mavi #3a4dff
- Film: kırmızı #d92d27
- Kitap: sarı #f5b31b

Açık tema: arka plan #eff0f6, açılır pencereler ve öne çıkan kutular beyaz, yazı #12142b.
Koyu tema: arka plan #0b0d1e, açılır pencereler ve öne çıkan kutular #13163a, yazı #eceffb.

Soluk yazıları, çizgileri ve ara tonları bu renklerle uyumlu olacak şekilde sen seç. Kategori renklerini yazı olarak kullanırken açık temada biraz koyusunu, koyu temada biraz açığını kullan ki okunsun.

Kategori renginde boyanmış büyük alanların (ana sayfadaki paneller gibi) üzerindeki yazılar beyaz olsun.


8. Yazı tipleri
İki yazı tipi kullan:
- Başlıklar, menüler, butonlar ve bütün arayüz yazıları için modern, kalın ve karakterli bir yazı tipi.
- Konu özetleri ve uzun okuma metinleri için kitap sayfası gibi okunaklı bir yazı tipi.
İkisi de Google Fonts'tan ücretsiz olsun. Yüklenemezlerse site bozulmasın, cihazın kendi yazı tipiyle görünsün.


9. Ana sayfa

Üst çubuk:
- Bilgisayarda sayfanın üstünde bir çubuk olsun. Bu çubuk, sayfa aşağı kaydırılsa bile ekranın üstünde sabit kalsın. Solda üç noktalı logo olsun; tıklanınca ana sayfaya dönülsün. Sağda sırasıyla Keşfet, Kaydedilenler ve tema butonları yer alsın.
- Telefonda üst çubukta yalnızca logo ve tema butonu yer alsın. Ekranın altında sabit bir alt çubuk olsun; orada Ana sayfa, Keşfet ve Kaydedilenler butonları bulunsun.

Giriş bölümü (telefonda her şey alt alta dursun, bilgisayarda aşağıda anlatıldığı gibi olsun):
- Solda "Ne izlesem, ne okusam?" başlığı olsun.
- Sağda şu açıklama olsun: "Dizi, film ve kitapların konusunu, kadrosunu ve künyesini oku. İzlemek ya da okumak istediğini seç veya daha sonrası için kaydet."
- Açıklamanın hemen altında bir arama kutusu olsun. Kutu boşken içinde "Ad ya da tür ara" yazsın; yanında "Ara" butonu olsun. Arama yapılınca Keşfet sayfası bu aramayla açılsın.
- Arama kutusunun altında "Bana bir şey öner" butonu olsun. Tıklanınca rastgele bir dizi, film ya da kitabın ayrıntı penceresi açılsın.

Kategori panelleri:
- Giriş bölümünün altında yan yana üç renkli panel olsun (telefonda alt alta): mavi Dizi, kırmızı Film, sarı Kitap.
- Her panelin sol üstünde bir simge ve kayıt sayısı bulunsun: "223 dizi", "657 film", "842 kitap".
- Panelin sağ üst yarısında o kategoriden üç kapak, hafif açılı ve üst üste dursun. Kapaklar o kategoriden rastgele seçilsin.
- Panelin alt yarısında solda büyük harflerle "Dizi", "Film" ya da "Kitap" yazsın. Hemen altında "Dizilere bak", "Filmlere bak", "Kitaplara bak" yazısı olsun.
- Bunların dışında panelde açıklama yazısı olmasın. Panellerdeki bütün yazılar beyaz olsun.
- Bilgisayarda fare bir panelin üstüne gelince o panel genişlesin; kapaklar panelin sağ kenarıyla birlikte kaysın ve üst üste duran kapaklar hafifçe açılsın. Telefonda bu genişleme olmasın.
- Panelin tamamı tıklanabilir olsun; tıklanınca Keşfet sayfası yalnızca o kategoriyle açılsın.


10. Keşfet

Üst kısım:
- Sabit üst çubuğun altında bir araç satırı olsun.
- Solda kategori butonları olsun: "Hepsi 1722", "Diziler 223", "Filmler 657", "Kitaplar 842". Butonlarda paneldekiyle aynı simgeler bulunsun ve butonlar kategori renklerini kullansın. Sayılar o anki arama ve filtrelere göre güncellensin.
- Ya "Hepsi" seçilebilsin ya da üç kategoriden biri veya ikisi birlikte seçilebilsin.
- Kategori butonlarının yanında arama kutusu olsun; boşken içinde "Ad ya da tür ara" yazsın.
- Arama kutusunun sağında sıralama menüsü olsun.
- Telefonda sıralama menüsünün yanında "Filtreler" butonu olsun.

Sıralama:
- Varsayılan sıralama "Önerilen sıra" olsun. Kayıtlar karışık görünsün ama her açılışta aynı sırada gelsin: Veri dosyası zaten karışık sıradadır, o sırayı kullan. "Hepsi" seçiliyken üç kategori dönüşümlü gelsin (bir dizi, bir film, bir kitap...); böylece liste tek bir kategoride yoğunlaşmaz.
- Diğer seçenekler: "Yeniden eskiye", "Eskiden yeniye", "A'dan Z'ye", "Z'den A'ya". Ada göre sıralarken Türkçe alfabe sırası kullanılsın.

Filtreler:
- Bilgisayarda filtreler ekranın solunda ayrı bir sütunda dursun. Telefonda "Filtreler" butonuna basınca açılan bir panelde olsun; panelin altındaki "Sonuçları göster" butonu paneli kapatsın.
- Dört filtre grubu olsun: Tür, Çıkış/yayın yılı, Orijinal dil ve Ülke.
- Tür: Alfabetik sırayla.
- Çıkış/yayın yılı: On yıllar hâlinde (1950'ler, 1960'lar...). Altında "En erken" ve "En geç" yazılabilen iki kutu olsun; o yıllar arasındaki kayıtlar gösterilsin.
- Orijinal dil: Önce Türkçe ve İngilizce, sonra diğerleri alfabetik sırayla.
- Ülke: Alfabetik sırayla. Kitaplarda ülke bilgisi olmadığı için yalnızca Kitaplar seçiliyken bu grup görünmesin.
- Her seçeneğin yanında, ona tıklanırsa kaç kayıt geleceği yazsın.
- Mevcut seçime göre hiç sonuç vermeyecek seçenekler gösterilmesin. Ancak kullanıcının zaten seçmiş olduğu bir seçenek, sayısı sıfıra düşse bile görünmeye devam etsin ki kaldırılabilsin.
- Bir grupta birden fazla seçenek seçilebilsin. Aynı gruptaki seçimlerden herhangi birine uyan kayıtlar gelsin (örneğin Dram veya Komedi); farklı gruplardaki seçimlerin hepsine birlikte uyan kayıtlar gelsin (örneğin Dram ve Türkçe).
- Seçili filtre butonu temanın zıt renginde görünsün (açık temada koyu, koyu temada açık).

Sonuçlar:
- Sonuçların üstünde kaç kayıt bulunduğu yazsın (hiç filtre yoksa "1722 sonuç").
- Bu sayının yanında seçili filtreler küçük butonlar olarak görünsün. Her birinde çarpı olsun ve tıklanınca o filtre kalksın. Birden fazla filtre seçiliyse "Tümünü temizle" butonu da çıksın.
- Kayıtlar ızgara biçiminde, dikdörtgen kartlar olarak dizilsin: bilgisayarda yan yana 4, tablette 3, telefonda 2 kart.
- İlk seferde 48 kayıt gösterilsin. Altta "Daha fazla göster (48 / 1722)" butonu olsun; her basışta 48 kayıt daha eklensin.

Kart:
- Kapağın sol üst köşesinde kategori adı yazsın, sağ üst köşesinde bir kaydet butonu bulunsun.
- Kapağın altında kaydın adı yazsın.
- Onun altında kategori adı (kategorinin kendi renginde), yanında yıl ve kısa bilgi yazsın: Dizi için sezon sayısı ("4 sezon"), film için süre ("1 sa 42 dk"), kitap için sayfa sayısı ("388 sayfa").
- En altta kaydın türleri yazsın. Kayıt bir seriye aitse yanında "Seri 1/3" gibi bir etiket olsun.
- Karta tıklanınca ayrıntı penceresi açılsın.

Arama kuralları:
- Büyük-küçük harf ve Türkçe karakter farkı önemsenmesin. Örneğin "SEHIR", "ŞEHİR", "Şehir", "Sehir", "şehir" ve "sehir" aramalarının hepsi aynı sonucu versin.
- Noktalama işaretleri dikkate alınmasın; adında noktalama işareti olan bir kayıt, işaret yazılmadan da bulunabilsin.
- Her kayıtta yalnızca kaydın adına ve türlerine bakılsın.
- Yazılan kelime, kayıttaki herhangi bir kelimenin başıyla eşleşsin; kelimenin ortası sayılmasın. Örneğin "kor" yazınca "Korku", "Koruma", "Dönen Koridor" ve "Okul Korosu" gelsin, ama "Akor" ya da "Skor" gelmesin.
- Birden fazla kelime yazılırsa her kelime eşleşmeli.
- Sıralama "Önerilen sıra" iken en alakalı sonuçlar başta gösterilsin: Önce adının ilk kelimesi eşleşen kayıtlar, sonra adının başka bir kelimesi eşleşenler, en son yalnızca türü eşleşenler.

Ayrıntı penceresinden gelen tıklamalar:
- Ayrıntı penceresinde bir türe, ülkeye ya da orijinal dile tıklanınca Keşfet, o filtre ve kaydın kendi kategorisi seçili olarak açılsın. Örneğin bir filmin ayrıntısında "İngilizce"ye tıklanınca orijinal dili İngilizce olan filmler listelensin.

Keşfet butonu:
- Üst çubuktaki (telefonda alt çubuktaki) Keşfet butonuna basılınca bütün filtreler ve arama sıfırlansın; "Önerilen sıra" ile 1722 kayıt açılsın.

Sonuç yoksa:
- Hiç sonuç yoksa ekranda büyük harflerle "Eşleşen bir şey bulunamadı" yazsın; altında "Aramayı ve filtreleri temizle" butonu olsun.


11. Ayrıntı penceresi
Bir kayda tıklanınca arka plan kararsın ve ekranın ortasında büyük bir ayrıntı penceresi açılsın. Pencerenin sağ üst köşesinde bir kapatma (✕) butonu olsun. Pencere ayrıca Esc tuşuyla ve karartılmış arka plana tıklanınca da kapansın.

Bilgisayarda:
- Pencere sol ve sağ olmak üzere iki sütundan oluşsun.
- Sol sütunda kaydın kapağı olsun. Altında dizi ve film için "İzle", kitap için "Oku" butonu olsun; bu butonlar kategorinin renginde olsun.
- Onun altında "Kaydet" butonu olsun. Butona basılınca "Kaydedildi" yazsın ve kaydet simgesinin içi dolsun. Tekrar basılınca kayıt kaldırılsın ve buton eski hâline dönsün.
- Sağ sütunun en üstünde, simgesiyle ve kategori renginde kategori adı yazsın ("Dizi", "Film" ya da "Kitap").
- Altında büyük başlıkla kaydın adı olsun.
- Onun altında yan yana üç bilgi bulunsun: Dizi için Sezon, Bölüm, Yayın (yıl aralığı); film için Süre, Yıl, Ülke; kitap için Sayfa, İlk yayın, Dil.
- Bir alt kısımda konu özeti yer alsın.
- Onun altında künye yer alsın:
  - Dizi için sırasıyla: yayın yılları, durum, sezon sayısı, toplam bölüm, yönetmen, oyuncular, yapım, tür, ülke, orijinal dil.
  - Film için sırasıyla: yıl, süre, yönetmen, oyuncular, tür, seri (varsa), ülke, orijinal dil.
  - Kitap için sırasıyla: ilk yayın yılı, yazar, çevirmen, sayfa sayısı, yayınevi, tür, seri (varsa), orijinal dil.
- Kayıt bir seriye aitse serinin diğer parçaları en altta, "Serinin diğer filmleri" ya da "Serinin diğer kitapları" başlığıyla, parça sırasına göre küçük kapaklarla gösterilsin. Birine tıklanınca pencere o kayda geçsin.

Telefonda:
- Pencere ekranın altından açılsın ve neredeyse bütün ekranı kaplasın.
- Sütunlar olmasın. Kapak solda, İzle/Oku ve Kaydet butonları sağda olsun.
- Geri kalan kısım bilgisayardaki sırayla alt alta devam etsin.


12. İzle ve Oku ekranları
Bu ekranlar gerçek bir izleme ya da okuma platformu gibi görünsün ama hiçbir içerik açılmasın. Sitede hiçbir video ya da kitap dosyası olmasın; yükleme taklittir ve sonunda her zaman kurgusal olduğunu söyleyen bir uyarı çıksın.

Genel:
- Ayrıntı penceresindeki İzle ya da Oku butonuna basılınca aynı sekmede, bütün ekranı kaplayan yeni bir ekran açılsın (yeni sekme açılmasın).
- Her ekranın sol üst köşesinde bir geri butonu bulunsun. Yanında: Dizi için sezon ve bölüm numarası ile dizinin adı; film için "Film" ve altında filmin adı; kitap için kitabın adı ve yazarı yazsın.

Dizi:
- Solda YouTube'daki gibi yatay bir oynatma ekranı olsun. Ekranın ortasında oynat butonu, altında bir kontrol çubuğu bulunsun. Süre göstergesinde "0:00" yazsın.
- Oynat butonuna basınca 2 saniye boyunca dönen bir halka ve "Yükleniyor" yazısı görünsün. Sonra "Oynatılamıyor" başlığı, altında "Bu dizi kurgusaldır, gerçekte bir görüntüsü yoktur." açıklaması ve onun altında "Tekrar dene" butonu çıksın. "Tekrar dene"ye basınca aynı döngü baştan başlasın.
- Oynatma ekranının altında bölüm numarası, onun altında sezon numarası yazsın.
- Altında "Önceki bölüm" ve "Sonraki bölüm" butonları olsun. Bu butonlar sezonlar arasında da geçsin (1. sezonun son bölümünden sonra 2. sezonun ilk bölümü gelsin). Dizinin ilk bölümünde "Önceki bölüm", son bölümünde "Sonraki bölüm" soluk ve tıklanamaz olsun.
- Sağda bölüm listesi olsun. Listenin sol üstünde "Bölümler", sağ üstünde sezon sayısı ve toplam bölüm sayısı yazsın. Altında sezon butonları olsun; hangi sezon seçildiyse onun bölümleri görünsün. Bölümlerin yanında süre yazmasın, yalnızca oynat simgesi olsun. İzlenen bölüm listede vurgulu görünsün; bir bölüme tıklanınca oynatıcı o bölüme geçsin.
- Veride yalnızca sezon sayısı ve toplam bölüm sayısı var. Toplam bölümleri sezonlara eşit dağıt; artan olursa ilk sezonlara birer birer ekle. Örneğin 4 sezon ve 25 bölüm varsa sezonlar 7, 6, 6, 6 bölüm olsun.

Film:
- Ortada dizidekiyle aynı tarzda bir oynatma ekranı olsun ve aynı yükleme döngüsü çalışsın. Uyarı metni: "Oynatılamıyor" başlığı, altında "Bu film kurgusaldır, gerçekte bir görüntüsü yoktur." ve "Tekrar dene" butonu.
- Ekranın altında filmin yılı, saat ve dakika cinsinden süresi ve türleri yazsın. Onun altında filmin konusu yer alsın.

Kitap:
- E-kitap okuma ekranına benzeyen bir ekran açılsın. Ortada kâğıt gibi bir sayfa ve üzerinde kitabın kapağı olsun.
- Dizi ve filmden farklı olarak burada bir şeye tıklamaya gerek kalmadan kitap kendiliğinden yüklenmeye başlasın. 2 saniye sonra "Kitap yüklenemedi" başlığı, altında "Bu kitap kurgusaldır, gerçekte bir metni yoktur." açıklaması ve "Tekrar dene" butonu çıksın.
- Sayfanın en altında okuma ilerlemesini gösteren bir çubuk olsun. Kitap açılmadığı için çubuk ilerlemesin. Çubuğun sonunda "0 / kitabın sayfa sayısı" yazsın (örneğin "0 / 388 sayfa").

Telefonda içerik aynı olsun ama her şey alt alta dursun (dizide bölüm listesi oynatma ekranının altına geçsin).


13. Kaydedilenler
- Üstte büyük harflerle "Kaydedilenler" başlığı, altında "Daha sonra izlemek ya da okumak üzere kaydettiklerin." açıklaması olsun.
- Kaydedilmiş hiçbir şey yoksa "Henüz bir şey kaydetmedin" yazsın.
- Kaydedilmiş kayıtlar varsa kategorilere ayrılsın: "İzlenecek diziler", "İzlenecek filmler", "Okunacak kitaplar". Her başlığın yanında o gruptaki kayıt sayısı yazsın. İçinde kayıt olmayan grup gösterilmesin.
- Kayıtlar Keşfet'teki kartlarla aynı görünsün. Son kaydedilen en başta dursun.
- Sağ üstte "Kaydedilenleri temizle" butonu olsun (sayfa boşken görünmesin). İlk basışta "Emin misin? Temizle" diye sorsun; ikinci kez basılırsa bütün kaydedilenler silinsin. Birkaç saniye içinde basılmazsa buton eski hâline dönsün.

14. Saklama
- Kaydedilenler ve tema seçimi yalnızca kullanıcının kendi tarayıcısında saklansın. Sunucu, hesap ya da üyelik olmasın.
- Site kapatılıp yeniden açıldığında kaydedilenler yerinde dursun.


15. Kapaklar
- Kapakların hiçbiri gerçek resim dosyası olmasın. Hepsi kodla çizilmiş, hoş renklerde kapaklar olsun. Gerçek fotoğraf ya da internetten görsel kullanılmasın.
- Kapaklar dikdörtgen (dik) olsun ve her kapağın üzerinde kaydın adı yazsın.
- Hiçbir kapak bir diğerinin aynısı olmasın.
- Üç kategorinin her birinin kendine özel bir kapak çerçevesi olsun; kapağa bakınca hangi kategori olduğu anlaşılsın.
- Bir kaydın kapağı sayfa değişse ya da yenilense bile hiçbir şekilde değişmesin.

16. Metinler
- Sitenin bütün yazıları Türkçe olsun ve kullanıcıya "sen" diye hitap edilsin.
- Bu brief'te yazılı olan metinler aynen kullanılsın. Brief'te yazmayan küçük yazılar kısa ve sade olsun; slogan, ünlem ya da emoji eklenmesin.
- Tarayıcı sekmesinde "Üç Nokta" yazsın. Bir kaydın ayrıntısı, oynatıcısı ya da okuyucusu açıkken "Kayıt adı — Üç Nokta" yazsın.
- Her sayfanın en altında şu metin yer alsın:
  "Üç Nokta; dizi, film ve kitapları tek yerde toplayan kurgusal bir platformdur. Üyelik, puan ve yorum yoktur; kaydettiklerin yalnızca bu tarayıcıda saklanır."
  "Sitedeki bütün diziler, filmler, kitaplar, kişiler, yapım şirketleri ve yayınevleri kurgudur; gerçek eser ya da kişilerle benzerlikler tesadüfidir. Oynatıcı ve okuma ekranları da kurgusaldır, hiçbir içerik açılmaz. Kapaklar, her eser için kodla üretilmiş çizimlerdir."

17. İçerik kuralı
- Bütün içerik yalnızca veri.json dosyasından ve bu brief'teki metinlerden gelsin. Yeni dizi, film, kitap ya da kişi üretme; verideki bilgileri değiştirme.
- Sahte kullanıcı yorumu, referans, puan, ödül, sertifika, iş ortağı logosu, kullanıcı sayısı ya da başarı iddiası uydurma.
- Gerçek bir eser, kişi, şirket ya da marka adı ekleme.
- Siteye üyelik, giriş yapma, puanlama ya da yorum yazma özelliği ekleme.

18. Teknik kural
- Yalnızca tarayıcıda çalışan bir ön yüz yap. Sunucuda çalışan kod, veritabanı, giriş sistemi, çerez, ziyaretçi takibi ya da reklam kodu ekleme.

19. Yayınlama
- Site Vercel'de yayınlanacak ve özel bir ayar dosyası gerekmeden çalışsın.


20. Kalite
- Site telefonda, tablette ve bilgisayarda düzgün görünsün; hiçbir ekran genişliğinde sayfa yana doğru kaymasın.
- Sayfanın bölümleri doğru HTML öğeleriyle yazılsın. Başlıklar mantıklı bir sırayla ilerlesin (sayfada tek bir ana başlık, altında alt başlıklar).
- Kapaklar ekran okuyucuda kaydın adıyla anlatılsın; yalnızca simgeden oluşan butonların (kaydet, kapat, tema, geri) okunabilir bir adı olsun.
- Her şey yalnızca klavyeyle de kullanılabilsin; klavyeyle seçilen öğenin etrafında belirgin bir halka görünsün.
- Yazılar rahat okunacak kadar büyük ve zeminle yeterince zıt renkte olsun.
- Sayfa başlığı, kısa bir açıklama (meta description) ve sekmede görünen küçük simge (yan yana üç renkli daire) olsun.
- Site hızlı açılsın; aynı anda en fazla 48 kart gösterilsin.

21. Çalışma şekli
1. Önce klasördeki veri.json dosyasını incele. Bu brief'le uyuşmayan bir şey görürsen bana söyle.
2. Kısa bir plan yaz ve onayımı bekle.
3. Brief'te anlamadığın ya da iki türlü anlaşılabilecek bir yer varsa tahmin yürütme, bana sor.
4. Siteyi yap, bilgisayarında çalıştır ve tarayıcıda kontrol et.
5. Bitince neyi denediğini ve sonucunu yaz. Deneyemediğin bir şey varsa açıkça söyle.
6. Bana her şeyi Türkçe yaz.