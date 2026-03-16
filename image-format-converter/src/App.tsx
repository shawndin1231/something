import { AppProvider } from './context';
import { ToastProvider } from './components/ui/Toast';
import { MainLayout } from './components/layout';
import { UploadArea, ImageList } from './components/upload';
import { ConfigPanel } from './components/config';
import { DownloadPanel } from './components/download';

function AppContent() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <section>
          <UploadArea />
          <ImageList />
        </section>

        <section>
          <ConfigPanel />
        </section>

        <DownloadPanel />
      </div>
    </MainLayout>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
