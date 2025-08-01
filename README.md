# Üretim İzleme Paneli

Bu proje, üretim verilerini anlık olarak izlemek ve görselleştirmek için geliştirilmiş bir web uygulamasıdır. Kullanıcıların makine bazında üretim verilerini yüklemesine, görüntülemesine ve analiz etmesine olanak tanır.

## Proje Hakkında

Uygulama, iki ana bölümden oluşmaktadır:

* **Backend (Sunucu):** Node.js ve Express ile geliştirilmiştir. CSV/Excel dosyalarının yüklenmesi, verilerin işlenmesi ve API aracılığıyla frontend'e sunulmasından sorumludur.

* **Frontend (Arayüz):** React.js kullanılarak geliştirilmiştir. Sunucudan gelen verileri dinamik grafikler ve tablolar halinde kullanıcıya sunar.

## Kullanılan Teknolojiler

### Backend
* Node.js
* Express.js
* Multer (Dosya yükleme işlemleri için)
* Nodemon (Geliştirme ortamında sunucuyu otomatik yeniden başlatmak için)
* XLSX (Excel dosyalarını okumak ve işlemek için)

### Frontend
* React.js
* React Router (Sayfa yönlendirmeleri için)
* Axios (API istekleri için)
* Chart.js (Veri görselleştirme ve grafikler için)

## Kurulum ve Çalıştırma

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
* Git
* Node.js (v16 veya üzeri tavsiye edilir)
* npm (Node.js ile birlikte otomatik olarak kurulur)

### Adım Adım Kurulum

1.  **Projeyi klonlayın (bilgisayarınıza indirin):**
    ```bash
    git clone <projenizin_github_linki>
    ```

2.  **Proje ana klasörüne gidin:**
    ```bash
    cd yaris_izleme-main
    ```

---

### Adım 1: Backend Sunucusunu Başlatma

Backend'i kurmak için **birinci terminalinizi** kullanın.

1.  **Backend klasörüne girin:**
    ```bash
    cd backend
    ```

2.  **Gerekli paketleri yükleyin:**
    ```bash
    npm install
    ```

3.  **Backend sunucusunu geliştirme modunda başlatın:**
    
    Bu komut, kodda değişiklik yaptığınızda sunucunun otomatik olarak yeniden başlamasını sağlar.
    ```bash
    npm run dev
    ```
    Sunucunun `Server is running on port 5000` gibi bir mesaj verdiğini göreceksiniz. **Bu terminali kapatmayın**, backend'in sürekli çalışması gerekiyor.

---

### Adım 2: Frontend Arayüzünü Başlatma

Şimdi **YENİ BİR TERMİNAL** açın. (Mevcut olanı kapatmayın, backend orada çalışıyor).

1.  **Yeni terminalde proje ana klasörüne geri dönün ve `frontend` klasörüne girin:**
    ```bash
    cd .. 
    cd frontend
    ```
    *İpucu: Eğer `yaris_izleme-main` klasöründeyseniz direkt `cd frontend` komutunu çalıştırabilirsiniz.*

2.  **Gerekli paketleri yükleyin:**
    ```bash
    npm install
    ```

3.  **Frontend uygulamasını başlatın:**
    ```bash
    npm start
    ```
    Bu komut, tarayıcınızda otomatik olarak yeni bir sekme açacak ve uygulamayı `http://localhost:3000` adresinde çalıştıracaktır.

### Özet

Kurulum tamamlandığında, projenin düzgün çalışması için **iki terminalin de aynı anda açık ve çalışır durumda** olması gerekmektedir:

1.  **Backend (API sunucusu)**
2.  **Frontend (Kullanıcı arayüzü)**
