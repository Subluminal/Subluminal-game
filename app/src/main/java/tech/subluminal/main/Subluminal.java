package tech.subluminal.main;

import java.lang.reflect.Field;
import java.nio.charset.Charset;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javafx.application.Application;
import org.pmw.tinylog.Configurator;
import org.pmw.tinylog.Level;
import org.pmw.tinylog.Logger;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;
import tech.subluminal.client.init.ClientInitializer;
import tech.subluminal.server.init.ServerInitializer;
import tech.subluminal.shared.util.NameGenerator;

/**
 * The main class of the Subluminal project containing the main function which starts the program.
 */
@Command(
    name = "Subluminal",
    description = "Starts the game in server or client mode.",
    showDefaultValues = true
)
public class Subluminal {

  @Option(names = {"-h", "--help"}, description = "Display help/usage.", help = true)
  boolean help;
  @Option(names = {"-ll", "--loglevel"}, description = "Sets the loglevel for the application. ")
  private String loglevel = "off";
  @Option(names = {"-lf", "--logfile"}, description = "Sets the path and filename for the logfile")
  private String logfile = "log.txt";
  @Option(names = {"-d", "--debug"}, description = "Enables the debug mode.")
  private boolean debug;
  @Parameters(index = "0", arity = "1", description = "Sets the application mode. Must be one of "
      + "\"server, client\".")
  private String mode;
  @Parameters(index = "1", arity = "0..1", description = "Specifies the connection details."
      + "In case of server this needs to be a \"port\"."
      + "In case of client this needs to be a \"host:port\".")
  private String hostAndOrPort = "164.132.199.58:1729";
  @Parameters(index = "2", arity = "0..1", description =
      "Sets the username. If none is specified the "
          + "system username will be used instead.")
  private String username = System.getProperty("user.name");

  /**
   * Parses the command line arguments and calls the relevant packages.
   *
   * @param args are the command line arguments.
   */
  public static void main(String[] args) {
    //DEBUGGING
    NameGenerator ng = new NameGenerator();
    ng.readStarFiles();

    System.setProperty("file.encoding","UTF-8");
    Field charset = null;
    try {
      charset = Charset.class.getDeclaredField("defaultCharset");
      charset.setAccessible(true);
      charset.set(null,null);
    } catch (NoSuchFieldException e) {
      e.printStackTrace();
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    }

    final Subluminal subl = CommandLine.populateCommand(new Subluminal(), args);

    final String preLevelTag = "[[preLevelTag]]";
    final String postLevelTag = "[[postLevelTag]]";

    if (subl.help) {
      System.out.println(printASCII());
      CommandLine.usage(subl, System.out, CommandLine.Help.Ansi.AUTO);
    } else {
      List<String> modes = Arrays.asList("server", "client");
      Map<String, Level> levelMap = new HashMap<String, Level>() {{
        put("off", Level.OFF);
        put("trace", Level.TRACE);
        put("debug", Level.DEBUG);
        put("info", Level.INFO);
        put("warning", Level.WARNING);
        put("error", Level.ERROR);
      }};

      if (levelMap.get(subl.loglevel) != null) {
        Configurator.currentConfig().level(levelMap.get(subl.loglevel)).activate();
      } else {
        Configurator.currentConfig().level(Level.OFF);
      }

      String host = "localhost";
      int port = 1729;
      Logger.debug("mode:" + subl.mode + " hostAndOrPort:" + subl.hostAndOrPort + " debug:" + String
          .valueOf(subl.debug) + " logfile:" + subl.logfile + " loglevel:" + subl.loglevel
          + " username:" + subl.username);

      String[] parts = subl.hostAndOrPort.split(":");

      if ("client".equals(subl.mode)) {
        if (parts.length != 2) {
          System.out.println("Host and port were not specified properly.");
          System.exit(1);
        }
        host = parts[0];
        try {
          port = Integer.parseInt(parts[1]);
        } catch (NumberFormatException e) {
          System.out.println(port);
        }
        initClient(host, port, subl.username, subl.debug);
      } else if ("server".equals(subl.mode)) {
        try {
          port = Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
          System.out.println(port);
        }
        initServer(port, subl.debug);
      } else {
        System.out.println("Invalid mode argument. Must be one of " + modes);
        System.exit(1);
      }

      //NameGenerator ng = new NameGenerator();
      //ng.readStarFiles();
      //System.out.println(ng.toString());
    }
  }

  private static void initClient(String host, int port, String username, boolean debug) {
    if (port >= 1024 && port < 65535) {
      //TODO: change that
      Application.launch(ClientInitializer.class, host, Integer.toString(port), username,
          String.valueOf(debug));
      System.exit(0);
      //String username = args.length > 2 ? args[2] : System.getProperty("user.name");
      //ClientInitializer.init(host, port, username);
    }
  }

  private static void initServer(int port, boolean debug) {
    ServerInitializer.init(port, debug);
  }

  private static String printASCII() {
    String logo = ""+"\n"+
    "  _____       _     _                 _             _ "+"\n"+
    " / ____|     | |   | |               (_)           | |"+"\n"+
    "| (___  _   _| |__ | |_   _ _ __ ___  _ _ __   __ _| |"+"\n"+
    " \\___ \\| | | | '_ \\| | | | | '_ ` _ \\| | '_ \\ / _` | |"+"\n"+
    " ____) | |_| | |_) | | |_| | | | | | | | | | | (_| | |"+"\n"+
    "|_____/ \\__,_|_.__/|_|\\__,_|_| |_| |_|_|_| |_|\\__,_|_|"+"\n"+
    "";
    return logo;
  }
}

