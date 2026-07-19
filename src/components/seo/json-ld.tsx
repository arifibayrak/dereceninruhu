/**
 * JSON-LD yapısal veri enjektörü. Sunucu bileşeni — tek bir
 * <script type="application/ld+json"> üretir. Birden fazla şema için `data`
 * bir dizi olabilir (tek script içinde JSON dizisi).
 *
 * İçerik tamamen bizim ürettiğimiz güvenilir veridir (kullanıcı girdisi değil);
 * yine de XSS'e karşı kapanış etiketi kaçışı uygulanır.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
