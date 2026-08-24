import re

class DomainExpander:
    """
    Enriquecedor Semántico de Dominio Técnico Exhaustivo (Enterprise Grade).
    Cubre una taxonomía integral de más de 300 tecnologías, frameworks, librerías,
    protocolos, herramientas y conceptos especializados en las 5 áreas clave:
    - DevOps / SRE / Cloud & Infraestructura
    - Backend / APIs / Bases de Datos & Seguridad
    - Frontend / Web / UX-UI & Browser
    - Data Science / Machine Learning / NLP & MLOps
    - Mobile / Android / iOS & Cross-Platform
    """
    def __init__(self):
        self.domain_mappings = {
            'DevOps': [
                # Orquestación, Contenedores y IaC
                r'\b(oci|oracle cloud|kubernetes|k8s|docker|containerd|podman|helm|kustomize|terraform|terragrunt|ansible|puppet|chef|vagrant|packer)\b',
                # Observabilidad, Métricas, Logs y Tracing
                r'\b(prometheus|grafana|alertmanager|datadog|new relic|dynatrace|splunk|elasticsearch|logstash|kibana|elk|jaeger|opentelemetry|loki|tempo|fluentd|fluentbit)\b',
                # Proveedores Cloud y Servicios de Red
                r'\b(aws|ec2|s3|ecs|eks|lambda|cloudwatch|azure|aks|gcp|google cloud|gke|cloud run|compute engine|vpc|subnet|vcn|route table|security group|security list|internet gateway|nat gateway)\b',
                # Ingress, Proxies, Servidores Web y TLS
                r'\b(nginx|apache|traefik|envoy|haproxy|caddy|ingress|ingress controller|cert-manager|letsencrypt|dns|ssl|tls|reverse proxy|load balancer|balanceador|balanceadores|alb|nlb|elb|service mesh|istio|linkerd)\b',
                # CI/CD, Repositorios y Automatización
                r'\b(github actions|gitlab ci|jenkins|argo cd|argocd|flux|tekton|circleci|bitbucket pipelines|runner|self-hosted runner|sonarqube|trivy|snyk|ci/cd|ci/cd pipeline|pipeline ci/cd|build pipeline|deployment pipeline)\b',
                # Sistemas Operativos, Storage y Ciclo de Vida Pods
                r'\b(linux|ubuntu|debian|rhel|centos|rocky|alpine|systemd|journalctl|crontab|bash|zsh|ssh|iptables|nfs|efs|pv|pvc|storageclass|csi|oomkilled|crashloopbackoff|readiness probe|liveness probe|despliegue|infraestructura|infraestructure|sysadmin|devops|cluster|clusters|pod|pods)\b'
            ],
            'Backend': [
                # Lenguajes, Runtimes y Frameworks
                r'\b(java|spring|spring boot|spring security|spring data|quarkus|micronaut|kotlin|c#|\.net|dotnet|asp\.net|golang|go|rust|node|node\.js|express|nestjs|django|fastapi|flask|php|laravel|ruby|rails)\b',
                # Bases de Datos Relacionales y NoSQL
                r'\b(postgresql|postgres|mysql|mariadb|oracle db|sql server|mongodb|cassandra|dynamodb|redis|memcached|neo4j|couchdb)\b',
                # ORM, Migraciones, Connection Pools y SQL
                r'\b(hibernate|jpa|mybatis|prisma|typeorm|sqlalchemy|entity framework|dapper|flyway|liquibase|hikaricp|connection pool|deadlock|deadlocks|isolation level|query plan|explain analyze|foreign key|indexación|sql|datasource|transaccion|transacciones)\b',
                # Mensajería, Event Streams y Colas
                r'\b(kafka|rabbitmq|activemq|ibm mq|nats|sqs|sns|amqp|pubsub|event driven|event stream|dead letter queue|dlq|consumer group|jsonparseexception)\b',
                # Arquitectura de Servicios y Protocolos
                r'\b(api rest|rest api|restful|graphql|grpc|soap|websocket|webhooks|openapi|swagger|microservicio|microservicios|hexagonal|ddd|event sourcing|cqrs|saga pattern|monolito|endpoint|endpoints|controller|servicio|backend)\b',
                # Seguridad, Autenticación y Resiliencia
                r'\b(jwt|oauth|oauth2|oidc|openid|saml|keycloak|auth0|bcrypt|argon2|cors|csrf|xss|sql injection|session management|rbac|abac|resilience4j|feign|webclient|resttemplate|retrofit|circuit breaker|bulkhead|retry pattern|rate limiting|bucket4j|cache-aside)\b'
            ],
            'Frontend': [
                # Frameworks y Librerías Core
                r'\b(react|reactjs|vue|vuejs|angular|svelte|solidjs|nextjs|nuxt|remix|astro|gatsby)\b',
                # Lenguajes, Bundlers y Tooling
                r'\b(javascript|typescript|html|html5|css|css3|scss|sass|less|vite|webpack|turbopack|rollup|esbuild|babel|npm|yarn|pnpm|bun)\b',
                # Gestión de Estado
                r'\b(redux|redux toolkit|rtk|zustand|mobx|recoil|jotai|pinia|vuex|context api|signals|useeffect|usecallback|usememo|usestate|usereducer)\b',
                # Estilos, Diseño y UI Kits
                r'\b(tailwind|tailwindcss|bootstrap|material ui|mui|chakra ui|shadcn|radix ui|ant design|styled components|emotion|css modules|flexbox|grid|css grid|responsive|responsivo|media query|dark mode|glassmorphism)\b',
                # APIs del Navegador y DOM
                r'\b(dom|virtual dom|shadow dom|canvas|webgl|indexeddb|localstorage|sessionstorage|cookies|service worker|pwa|fetch|axios|postmessage|eventlistener|hydration)\b',
                # Rendimiento, Accesibilidad y UX
                r'\b(lighthouse|core web vitals|lcp|fid|cls|inp|code splitting|lazy loading|tree shaking|ssr|ssg|isr|csr|bundle size|polyfill|wcag|aria|a11y|screen reader|accesibilidad|frontend|spa|ui|ux|interfaz|componente|componentes)\b'
            ],
            'Data Science': [
                # Librerías y Frameworks ML / DL
                r'\b(python|scikit-learn|sklearn|pandas|numpy|scipy|statsmodels|tensorflow|keras|pytorch|torch|xgboost|lightgbm|catboost|fastai|huggingface|transformers)\b',
                # Algoritmos y Modelos
                r'\b(random forest|decision tree|linear regression|logistic regression|svm|support vector|k-means|kmeans|dbscan|pca|t-sne|clustering|naive bayes|knn|gradient boosting|neural network|cnn|rnn|lstm|gpt|llm|bert|clasificador)\b',
                # NLP y Procesamiento de Texto
                r'\b(tfidf|tf-idf|tfidfvectorizer|countvectorizer|word2vec|embeddings|spacy|nltk|gensim|tokenization|stemming|lemmatization|stop words|n-grams|topic modeling|lda|sentiment analysis|nlp)\b',
                # Preprocesamiento, Validación y Métricas
                r'\b(smote|imblearn|feature engineering|standardscaler|minmaxscaler|onehotencoder|train test split|cross validation|k-fold|gridsearch|optuna|roc auc|confusion matrix|precision|recall|f1-score|mae|mse|rmse|silhouette|silhouette score|elbow method|inercia|overfitting|underfitting|hiperparametros)\b',
                # MLOps y Monitoreo
                r'\b(mlflow|dvc|wandb|tensorboard|data drift|concept drift|psi|population stability index|model registry|model monitoring|joblib|pickle|pkl|onnx|dataset|datasets|dataframe|data science|machine learning|deep learning|aprendizaje automatico|pipeline ml|pipeline de machine learning|pipeline scikit-learn)\b'
            ],
            'Mobile': [
                # Frameworks Multiplataforma
                r'\b(flutter|dart|react native|ionic|capacitor|cordova|xamarin|\.net maui|unity)\b',
                # Ecosistema Nativo iOS
                r'\b(swift|swiftui|objective-c|uikit|xcode|cocoapods|spm|testflight|app store connect|provisioning profile|certificate|apns|push notifications ios|info\.plist|ipa)\b',
                # Ecosistema Nativo Android
                r'\b(android|kotlin|java android|android studio|jetpack compose|xml layout|gradle|build\.gradle|apk|aab|android app bundle|play store|google play console|proguard|r8|fcm|firebase cloud messaging|intent|activity|fragment|viewmodel|room db)\b',
                # Capacidades Móviles y Dispositivos
                r'\b(biometrics|camera|geolocation|push notification|push notifications|deeplink|universal links|offline first|sqlite mobile|secure storage|keystore|keychain|mobile|móvil|movil|smartphones|smartphone|tablet|flatlist|provisioning|play store|app store)\b'
            ]
        }

        # Tokens ancla con fuerte peso probabilístico en modelo_hacka.pkl
        self.anchors = {
            'DevOps': ' docker kubernetes linux nginx terraform devops ',
            'Backend': ' java spring boot postgresql sql jpa api rest backend ',
            'Frontend': ' react frontend css web interfaz usuario ',
            'Data Science': ' pandas numpy machine learning data science python ',
            'Mobile': ' móvil android ios flutter mobile react native '
        }

        # Precompilar expresiones regulares para rendimiento ultrarrápido en memoria
        self.compiled_rules = {
            cat: [re.compile(pat, re.IGNORECASE) for pat in patterns]
            for cat, patterns in self.domain_mappings.items()
        }

    def enrich(self, text: str) -> str:
        """
        Analiza el texto sanitizado e inyecta los tokens ancla correspondientes
        a las áreas de dominio detectadas para alimentar la inferencia del modelo.
        """
        if not text or not isinstance(text, str):
            return ""

        clean_text = text.lower()
        injections = []

        for category, patterns in self.compiled_rules.items():
            for regex in patterns:
                if regex.search(clean_text):
                    injections.append(self.anchors[category])
                    break

        if injections:
            return f"{text} {' '.join(injections)}"
        return text

domain_expander = DomainExpander()
